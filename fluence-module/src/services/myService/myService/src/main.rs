#![allow(non_snake_case)]
use marine_rs_sdk::marine;
use marine_rs_sdk::module_manifest;


use ark_bn254::{Bn254, Fr as ArkFr};
use ark_ec::pairing::Pairing;
use ark_ff::PrimeField;
use ark_groth16::Proof;

use ark_groth16::{Groth16, ProvingKey, VerifyingKey};
use ark_r1cs_std::fields::fp::FpVar;
use ark_r1cs_std::prelude::*;
use ark_relations::r1cs::{ConstraintSynthesizer, ConstraintSystemRef, SynthesisError};
use ark_serialize::CanonicalSerialize;
use ark_std::rand::thread_rng;
use chrono::Utc;
use hex;
use light_poseidon::{Poseidon, PoseidonHasher};
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::fmt::{Display, Formatter};

module_manifest!();

pub fn main() {}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DataEntry {
    pub timestamp: String,
    pub user_data_hash: String,
    pub received_data_hash: String,
    pub path: String,
    pub merkle_proof: MerkleProof,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MerkleProof {
    pub siblings: Vec<String>,
    pub parent_hashes: Vec<String>,
}

#[derive(Clone)]
struct DataVerificationEntry {
    data_hash: ArkFr,
    root_hash: ArkFr,
    siblings: Vec<ArkFr>,
    path_bits: Vec<bool>,
}

impl ConstraintSynthesizer<ArkFr> for DataVerificationEntry {
    fn generate_constraints(self, cs: ConstraintSystemRef<ArkFr>) -> Result<(), SynthesisError> {
        let data_hash_var = FpVar::<ArkFr>::new_input(cs.clone(), || Ok(self.data_hash))?;
        let mut current_hash = data_hash_var.clone();

        for (sibling_hash, path_bit) in self.siblings.iter().zip(self.path_bits.iter()) {
            let sibling_var = FpVar::<ArkFr>::new_input(cs.clone(), || Ok(*sibling_hash))?;
            let (left, right) = if *path_bit {
                (current_hash.clone(), sibling_var)
            } else {
                (sibling_var, current_hash.clone())
            };

            let left_value = left.value().map_err(|e| {
                println!("Failed to get left value: {:?}", e);
                SynthesisError::AssignmentMissing
            })?;
            let right_value = right.value().map_err(|e| {
                println!("Failed to get right value: {:?}", e);
                SynthesisError::AssignmentMissing
            })?;

            let mut hasher = Poseidon::<ArkFr>::new_circom(2).unwrap();
            let result_hash = hasher.hash(&[left_value, right_value]).unwrap();

            current_hash = FpVar::<ArkFr>::new_input(cs.clone(), || Ok(result_hash))?;
        }

        let root_hash_var = FpVar::<ArkFr>::new_input(cs.clone(), || Ok(self.root_hash))?;
        root_hash_var.enforce_equal(&current_hash)?;

        Ok(())
    }
}

fn hex_to_scalar(hex_str: &str) -> Result<ArkFr, Box<dyn Error>> {
    let hex_str = hex_str.trim_start_matches("0x");
    let mut bytes = [0u8; 32];
    hex::decode_to_slice(hex_str, &mut bytes)
        .map_err(|err| format!("Error decoding hex: {}", err))?;
    Ok(ArkFr::from_le_bytes_mod_order(&bytes))
}

#[derive(Debug)]
struct CustomError(String);

impl From<String> for CustomError {
    fn from(s: String) -> Self {
        CustomError(s)
    }
}

impl Error for CustomError {}

impl Display for CustomError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

fn poseidon_hash_to_fr(hash: &[u8]) -> Result<ArkFr, SynthesisError> {
    if hash.len() != 32 {
        return Err(SynthesisError::Unsatisfiable);
    }

    let mut bytes_array = [0u8; 32];
    bytes_array.copy_from_slice(hash);
    Ok(ArkFr::from_le_bytes_mod_order(&bytes_array))
}

fn parse_static_json_data() -> Result<Vec<DataEntry>, Box<dyn Error>> {
    let json_data = r#"{
        "success": true,
        "message": "Data committed successfully.",
        "dataHash": "0xf424d8baf8e3b60b9faa437d976e345b2073d5477c2f0e3e83dcd8814addc809",
        "rootHash": "89b274c5fdb5cc379f176c036684184ec961c2395a34b6e18f9f5895abf783a7",
        "path": "10",
        "merkleProof": {
            "siblings": [
                "0x3204af7694cb4c6dd297bd103b3363fe2ce0fc2dd2f60e2bac51fdafaf71061a"
            ],
            "parentHashes": [
                "89b274c5fdb5cc379f176c036684184ec961c2395a34b6e18f9f5895abf783a7"
            ]
        }
    }
    "#;

    let parsed: serde_json::Value = serde_json::from_str(json_data)?;
    let data_hash_hex = parsed["dataHash"].as_str().unwrap().to_string();
    let root_hash_hex = parsed["rootHash"].as_str().unwrap().to_string();
    let path = parsed["path"].as_str().unwrap().to_string();
    let siblings = parsed["merkleProof"]["siblings"]
        .as_array()
        .unwrap()
        .iter()
        .map(|sibling| sibling.as_str().unwrap().to_string())
        .collect();
    let parent_hashes = parsed["merkleProof"]["parentHashes"]
        .as_array()
        .unwrap()
        .iter()
        .map(|parent_hash| parent_hash.as_str().unwrap().to_string())
        .collect();

    Ok(vec![DataEntry {
        timestamp: Utc::now().to_rfc3339(),
        user_data_hash: data_hash_hex,
        received_data_hash: root_hash_hex,
        path,
        merkle_proof: MerkleProof {
            siblings,
            parent_hashes,
        },
    }])
}

fn serialize_proof<E: Pairing>(proof: &Proof<E>) -> Result<String, Box<dyn Error>> {
    let mut proof_bytes = vec![];
    proof.serialize_uncompressed(&mut proof_bytes)?;
    Ok(hex::encode(proof_bytes))
}

fn generate_proof(data_entries: &[DataEntry]) -> Result<String, Box<dyn Error>> {
    let mut csprng = thread_rng();

    let mut results = Vec::new();

    for entry in data_entries {
        let user_data_hash_bytes =
            hex::decode(&entry.user_data_hash[2..]).expect("Decoding hex failed");
        let received_data_hash_bytes =
            hex::decode(&entry.received_data_hash[2..]).expect("Decoding hex failed");
        let data_hash = poseidon_hash_to_fr(&user_data_hash_bytes)?;
        let root_hash = poseidon_hash_to_fr(&received_data_hash_bytes)?;

        let path_bits = entry
            .path
            .chars()
            .map(|c| match c {
                '0' => Ok(false),
                '1' => Ok(true),
                _ => Err(SynthesisError::Unsatisfiable),
            })
            .collect::<Result<Vec<bool>, SynthesisError>>()?;

        let siblings = entry
            .merkle_proof
            .siblings
            .iter()
            .map(|sibling| {
                let bytes = hex::decode(&sibling[2..]).map_err(|e| {
                    let err_msg = format!("Error decoding hex sibling: {}", e);
                    SynthesisError::AssignmentMissing
                })?;
                poseidon_hash_to_fr(&bytes)
            })
            .collect::<Result<Vec<_>, SynthesisError>>()?;

        let circuit = DataVerificationEntry {
            data_hash,
            root_hash,
            siblings,
            path_bits,
        };

        let params = Groth16::<Bn254>::generate_random_parameters_with_reduction(
            circuit.clone(),
            &mut csprng,
        )?;
        let proof =
            Groth16::<Bn254>::create_random_proof_with_reduction(circuit, &params, &mut csprng)?;

        let proof_serialized = serialize_proof(&proof)?;
        results.push(format!("Proof: {}", proof_serialized));
    }

    Ok(results.join(", "))
}



fn setup_static_data_entries() -> Vec<DataEntry> {
    let json_data = r#"{
        "success": true,
        "message": "Data committed successfully.",
        "dataHash": "0xf424d8baf8e3b60b9faa437d976e345b2073d5477c2f0e3e83dcd8814addc809",
        "rootHash": "89b274c5fdb5cc379f176c036684184ec961c2395a34b6e18f9f5895abf783a7",
        "path": "10",
        "merkleProof": {
            "siblings": [
                "0x3204af7694cb4c6dd297bd103b3363fe2ce0fc2dd2f60e2bac51fdafaf71061a"
            ],
            "parentHashes": [
                "89b274c5fdb5cc379f176c036684184ec961c2395a34b6e18f9f5895abf783a7"
            ]
        }
    }
    "#;

    let parsed: serde_json::Value = serde_json::from_str(json_data).unwrap();
    let data_hash_hex = parsed["dataHash"].as_str().unwrap().to_string();
    let root_hash_hex = parsed["rootHash"].as_str().unwrap().to_string();
    let path = parsed["path"].as_str().unwrap().to_string();
    let siblings = parsed["merkleProof"]["siblings"]
        .as_array()
        .unwrap()
        .iter()
        .map(|sibling| sibling.as_str().unwrap().to_string())
        .collect();
    let parent_hashes = parsed["merkleProof"]["parentHashes"]
        .as_array()
        .unwrap()
        .iter()
        .map(|parent_hash| parent_hash.as_str().unwrap().to_string())
        .collect();

    vec![DataEntry {
        timestamp: Utc::now().to_rfc3339(),
        user_data_hash: data_hash_hex,
        received_data_hash: root_hash_hex,
        path,
        merkle_proof: MerkleProof {
            siblings,
            parent_hashes,
        },
    }]
}

#[test]
fn test_generate_proof() {
    let data_entries = setup_static_data_entries();
    let proof = generate_proof(&data_entries).unwrap();
    assert!(!proof.is_empty());
}


#[marine]
fn test_generate_proof_with_static_data(name: String) -> String {
    let data_entries = setup_static_data_entries();
    let proof_result = generate_proof(&data_entries);

    match &proof_result {
        // Use a reference to the original proof_result to avoid moving it
        Ok(proof) => println!("Generated Proof: {}", proof),
        Err(ref e) => println!("Error generating proof: {:?}", e), // Changed to `ref e` to borrow rather than move
    }

    assert!(
        proof_result.is_ok(),
        "The proof generation should complete successfully."
    );

    format!("Hi, {:?}", proof_result)
}