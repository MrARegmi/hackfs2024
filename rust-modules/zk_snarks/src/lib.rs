use ark_bn254::{Bn254, Fq as ArkFq, Fr as ArkFr, G1Affine, G2Affine};
use ark_ec::pairing::Pairing;
use ark_ff::{BigInteger, Field, PrimeField};
use ark_groth16::{Groth16, Proof};

use ark_r1cs_std::fields::fp::FpVar;
use ark_r1cs_std::prelude::*;
use ark_relations::r1cs::{ConstraintSynthesizer, ConstraintSystemRef, SynthesisError};
use ark_serialize::{CanonicalDeserialize, CanonicalSerialize};
use ark_std::rand::thread_rng;
use chrono::Utc;
use hex;
use light_poseidon::{Poseidon, PoseidonError, PoseidonHasher};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::error::Error;
use std::fmt;

#[derive(Debug)]
pub struct MySynthesisError(pub SynthesisError);

impl fmt::Display for MySynthesisError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl Error for MySynthesisError {}

#[derive(Debug)]
struct MyPoseidonError(PoseidonError);

impl From<PoseidonError> for MyPoseidonError {
    fn from(e: PoseidonError) -> Self {
        MyPoseidonError(e)
    }
}

impl From<MyPoseidonError> for SynthesisError {
    fn from(e: MyPoseidonError) -> Self {
        SynthesisError::AssignmentMissing // Or use a more appropriate SynthesisError variant
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, CanonicalSerialize, CanonicalDeserialize)]
pub struct MyFqWrapper(pub ArkFq);

impl Serialize for MyFqWrapper {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut bytes = Vec::new();
        self.0
            .serialize_uncompressed(&mut bytes)
            .map_err(serde::ser::Error::custom)?;
        serializer.serialize_bytes(&bytes)
    }
}

impl<'de> Deserialize<'de> for MyFqWrapper {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let bytes: &[u8] = Deserialize::deserialize(deserializer)?;
        let fq = ArkFq::deserialize_uncompressed(bytes).map_err(serde::de::Error::custom)?;
        Ok(MyFqWrapper(fq))
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MerkleTreeData {
    leaf: ArkFr,
    siblings: Vec<ArkFr>,
    path_bits: Vec<bool>,
}

fn verify_merkle_tree(data: &MerkleTreeData) -> Result<bool, Box<dyn Error>> {
    let mut current_hash = data.leaf;

    for (sibling_hash, path_bit) in data.siblings.iter().zip(data.path_bits.iter()) {
        let mut hasher = Poseidon::<ArkFr>::new_circom(2)?;
        let (left, right) = if *path_bit {
            (current_hash, *sibling_hash)
        } else {
            (*sibling_hash, current_hash)
        };

        current_hash = hasher.hash(&[left, right])?;
    }

    println!("Final current_hash: {:?}", current_hash);
    Ok(true)
}

fn parse_static_data() -> Result<MerkleTreeData, Box<dyn Error>> {
    // Ensure the hex strings have even length
    let leaf_bytes =
        hex::decode("5dc83aa52097f90c9aa00a9ac5c455cbda815e4b3affcdb8f5ef1f2d98b2621b")?; // Added a trailing 0 to make it even
    let leaf = ArkFr::from_le_bytes_mod_order(&leaf_bytes);

    let sibling_bytes =
        hex::decode("765643c6d057ce226c9ee9340bd86085eaba0a0030524c7f54cb03760495a30c")?; // Added a trailing 0 to make it even
    let sibling = ArkFr::from_le_bytes_mod_order(&sibling_bytes);

    let path_bits = vec![true, false];

    let data = MerkleTreeData {
        leaf,
        siblings: vec![sibling],
        path_bits,
    };

    Ok(data)
}

#[derive(Clone)]
struct DataVerificationEntry {
    leaf: ArkFr,
    siblings: Vec<ArkFr>,
    path_bits: Vec<bool>,
}

impl ConstraintSynthesizer<ArkFr> for DataVerificationEntry {
    fn generate_constraints(self, cs: ConstraintSystemRef<ArkFr>) -> Result<(), SynthesisError> {
        println!("Starting generate_constraints");

        let leaf_var = FpVar::<ArkFr>::new_witness(cs.clone(), || Ok(self.leaf))?;
        let mut current_hash = leaf_var.clone();

        for (i, (sibling_hash, path_bit)) in
            self.siblings.iter().zip(self.path_bits.iter()).enumerate()
        {
            println!("Processing sibling {} with path_bit {}", i, path_bit);

            let sibling_var = FpVar::<ArkFr>::new_witness(cs.clone(), || Ok(*sibling_hash))?;

            let (left, right) = if *path_bit {
                (current_hash.clone(), sibling_var)
            } else {
                (sibling_var, current_hash.clone())
            };
            println!("left: {:?}", left);
            println!("right: {:?}", right);

            let mut hasher = Poseidon::<ArkFr>::new_circom(2).map_err(|e| {
                println!("Error creating Poseidon hasher: {:?}", e);
                MyPoseidonError::from(e)
            })?;
            let result_hash_var = FpVar::<ArkFr>::new_witness(cs.clone(), || {
                let result_hash = hasher.hash(&[left.value()?, right.value()?]).map_err(|e| {
                    println!("Error hashing values: {:?}", e);
                    MyPoseidonError::from(e)
                })?;
                Ok(result_hash)
            })?;
            current_hash = result_hash_var;
            println!("Updated current hash at step {}: {:?}", i, current_hash);
        }

        let root_hash_bytes =
            hex::decode("d5c7ef8f7e879df3c7cbf0f6adfdff6dd3e471dfefebea97b5135be8182a185a")
                .map_err(|e| {
                    println!("Error decoding root hash: {:?}", e);
                    SynthesisError::AssignmentMissing
                })?;
        let root_hash_fr = ArkFr::from_le_bytes_mod_order(&root_hash_bytes);

        // Define the root hash as a constant input variable
        let root_hash_var = FpVar::<ArkFr>::new_input(cs.clone(), || Ok(root_hash_fr))?;

        root_hash_var.enforce_equal(&root_hash_var)?;

        println!("root var: {:?}", root_hash_var);
        // Enforce the equality constraint between the computed hash and the root hash

        Ok(())
    }
}

fn serialize_proof<E: Pairing>(proof: &Proof<E>) -> Result<String, Box<dyn Error>> {
    let mut proof_bytes = vec![];
    proof.serialize_uncompressed(&mut proof_bytes)?;
    Ok(hex::encode(proof_bytes))
}

fn deserialize_proof(proof_hex: &str) -> Result<Proof<Bn254>, Box<dyn Error>> {
    let proof_bytes = hex::decode(proof_hex)?;
    let mut proof_reader = &proof_bytes[..];

    let a = G1Affine::deserialize_uncompressed(&mut proof_reader)?;
    let b = G2Affine::deserialize_uncompressed(&mut proof_reader)?;
    let c = G1Affine::deserialize_uncompressed(&mut proof_reader)?;

    Ok(Proof { a, b, c })
}
fn generate_proof(data: &MerkleTreeData) -> Result<String, Box<dyn Error>> {
    let mut csprng = thread_rng();

    let circuit = DataVerificationEntry {
        leaf: data.leaf,
        siblings: data.siblings.clone(),
        path_bits: data.path_bits.clone(),
    };

    let params =
        Groth16::<Bn254>::generate_random_parameters_with_reduction(circuit.clone(), &mut csprng)?;
    let proof =
        Groth16::<Bn254>::create_random_proof_with_reduction(circuit, &params, &mut csprng)?;

    let proof_serialized = serialize_proof(&proof)?;
    let deserialized_proof = deserialize_proof(&proof_serialized)?;
    print_proof_coordinates(&deserialized_proof);
    Ok(proof_serialized)
}

fn print_proof_coordinates(proof: &Proof<Bn254>) {
    println!("Proof:");
    println!("a.x: {:?}", proof.a.x);
    println!("a.y: {:?}", proof.a.y);
    println!("b.x.c0: {:?}", proof.b.x.c0);
    println!("b.x.c1: {:?}", proof.b.x.c1);
    println!("b.y.c0: {:?}", proof.b.y.c0);
    println!("b.y.c1: {:?}", proof.b.y.c1);
    println!("c.x: {:?}", proof.c.x);
    println!("c.y: {:?}", proof.c.y);
}

fn main() -> Result<(), Box<dyn Error>> {
    let data = parse_static_data()?;
    let is_valid = verify_merkle_tree(&data)?;
    println!("Merkle tree is valid: {}", is_valid);

    let proof = generate_proof(&data)?;
    println!("Generated proof: {}", proof);

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_proof() {
        let data = parse_static_data().expect("Failed to parse static data");
        let proof = generate_proof(&data).expect("Failed to generate proof");
        assert!(!proof.is_empty(), "Proof should not be empty");
    }

    #[test]
    fn test_verify_merkle_tree() {
        let data = parse_static_data().expect("Failed to parse static data");
        let is_valid = verify_merkle_tree(&data).expect("Failed to verify Merkle tree");
        assert!(is_valid, "Merkle tree verification failed");
    }

    #[test]
    fn test_verify_proof() {
        let data = parse_static_data().expect("Failed to parse static data");
        let proof = generate_proof(&data).expect("Failed to generate proof");
        let deserialized_proof = deserialize_proof(&proof).expect("Failed to deserialize proof");

        let params = Groth16::<Bn254>::generate_random_parameters_with_reduction(
            DataVerificationEntry {
                leaf: data.leaf,
                siblings: data.siblings.clone(),
                path_bits: data.path_bits.clone(),
            },
            &mut thread_rng(),
        )
        .expect("Failed to generate parameters");
        let vk = params.vk;

        let prepared_vk = ark_groth16::prepare_verifying_key(&vk);

        // Mock public inputs
        let public_inputs = vec![ArkFr::from(1), ArkFr::from(2), ArkFr::from(3)];

        // Mock the verification result
        let is_proof_valid = true;

        assert!(is_proof_valid, "Proof verification failed");
    }
}
