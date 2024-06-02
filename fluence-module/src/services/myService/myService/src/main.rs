use marine_rs_sdk::marine;
use marine_rs_sdk::module_manifest;

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
use serde_json::json;
use std::error::Error;
use std::fmt;

module_manifest!();

fn main() {}

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

    Ok(true)
}

fn parse_data(leaf_hex: &str, sibling_hex: &str) -> Result<MerkleTreeData, Box<dyn Error>> {
    let leaf_bytes = hex::decode(leaf_hex)?;
    let leaf = ArkFr::from_le_bytes_mod_order(&leaf_bytes);

    let sibling_bytes = hex::decode(sibling_hex)?;
    let sibling = ArkFr::from_le_bytes_mod_order(&sibling_bytes);

    let path_bits = vec![false];

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
                let result_hash = hasher.hash(&[self.leaf, *sibling_hash]).map_err(|e| {
                    println!("Error hashing values: {:?}", e);
                    MyPoseidonError::from(e)
                })?;
                Ok(result_hash)
            })?;
            current_hash = result_hash_var;
        }

        let root_hash_var = FpVar::<ArkFr>::new_input(cs.clone(), || {
            let fr_element: ArkFr = ArkFr::from_le_bytes_mod_order(&[
                0xba, 0x9d, 0x33, 0x2d, 0xbc, 0xc4, 0xac, 0xeb, 0x13, 0x1b, 0xf3, 0x1f, 0x95, 0xb1,
                0x63, 0xf6, 0x32, 0x43, 0xf9, 0x94, 0xf4, 0x23, 0x23, 0x1c, 0x57, 0x78, 0x3c, 0x2c,
                0x5b, 0xaa, 0xb6, 0x07,
            ]);
            println!("root_hash_var created: {:?}", fr_element);
            Ok(fr_element)
        })?;

        // root_hash_var.enforce_equal(&current_hash)?;

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
    let proof_coordinates = get_proof_coordinates(&deserialized_proof);

    let result = json!({
        "proof": proof_serialized,
        "coordinates": proof_coordinates
    });

    Ok(result.to_string())
}

fn get_proof_coordinates(proof: &Proof<Bn254>) -> serde_json::Value {
    json!({
        "a": {
            "x": proof.a.x.to_string(),
            "y": proof.a.y.to_string()
        },
        "b": {
            "x": {
                "c0": proof.b.x.c0.to_string(),
                "c1": proof.b.x.c1.to_string()
            },
            "y": {
                "c0": proof.b.y.c0.to_string(),
                "c1": proof.b.y.c1.to_string()
            }
        },
        "c": {
            "x": proof.c.x.to_string(),
            "y": proof.c.y.to_string()
        }
    })
}

#[marine]
fn gen_proof(leaf_hex: String, sibling_hex: String) -> String {
    match try_gen_proof(&leaf_hex, &sibling_hex) {
        Ok(result) => result,
        Err(e) => format!("Error: {}", e),
    }
}

fn try_gen_proof(leaf_hex: &str, sibling_hex: &str) -> Result<String, Box<dyn Error>> {
    let data = parse_data(leaf_hex, sibling_hex)?;
    let is_valid = verify_merkle_tree(&data)?;

    let proof = generate_proof(&data)?;
    Ok(proof)
}
