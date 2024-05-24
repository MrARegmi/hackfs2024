#![allow(non_snake_case)]

use marine_rs_sdk::marine;
use marine_rs_sdk::module_manifest;
use serde::{Serialize, Deserialize};
use bls12_381::{Bls12, Scalar as Fr};
use chrono::{Utc};
use rand::{thread_rng};
use bellman::{groth16, Circuit, ConstraintSystem, SynthesisError};
use std::error::Error;
use std::convert::TryInto;
use hex;

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

struct DataVerificationEntry {
    frontend_hash: Fr,
    backend_hash: Fr,
    new_data_commitment: Fr,
    existing_data_commitments: Vec<Fr>,
}

impl Circuit<Fr> for DataVerificationEntry {
    fn synthesize<CS: ConstraintSystem<Fr>>(self, cs: &mut CS) -> Result<(), SynthesisError> {
        let frontend_hash_var = cs.alloc_input(|| "frontend_hash", || Ok(self.frontend_hash))?;
        let backend_hash_var = cs.alloc_input(|| "backend_hash", || Ok(self.backend_hash))?;

        cs.enforce(
            || "hash integrity check",
            |lc| lc + frontend_hash_var,
            |lc| lc + CS::one(),
            |lc| lc + backend_hash_var,
        );

        let new_data_commitment_var =
            cs.alloc_input(|| "new_data_commitment", || Ok(self.new_data_commitment))?;
        for (i, commitment) in self.existing_data_commitments.iter().enumerate() {
            let commitment_var = cs.alloc_input(|| format!("commitment_{}", i), || Ok(*commitment))?;
            cs.enforce(
                || format!("non-duplication check for commitment {}", i),
                |lc| lc + new_data_commitment_var - commitment_var,
                |lc| lc + CS::one(),
                |lc| lc,
            );
        }

        Ok(())
    }
}

fn bytes_to_fr(bytes: &[u8]) -> Result<Fr, Box<dyn Error>> {
    // More detailed logging to track the flow of execution
    println!("Attempting to convert bytes: {:?}", bytes);
    if bytes.len() != 32 {
        return Err(format!("Invalid byte length: expected 32, got {}", bytes.len()).into());
    }

    let bytes_array: [u8; 32] = bytes.try_into().expect("Length verified; qed");
    let fr_option = Fr::from_bytes(&bytes_array);
    println!("Conversion result: {:?}", fr_option);

    if fr_option.is_some().unwrap_u8() == 1 {
        Ok(fr_option.unwrap())
    } else {
        Err("Conversion to Fr failed".into())
    }
}

fn setup_static_data_entries(json_data: &str) -> Result<Vec<DataEntry>, Box<dyn Error>> {
    // More detailed logging to track the flow of execution
    println!("Received JSON data: {:?}", json_data);

    let parsed: serde_json::Value = serde_json::from_str(json_data)?;
    let data_hash_hex = parsed["dataHash"].as_str().ok_or("Missing dataHash field")?;
    let root_hash_hex = parsed["rootHash"].as_str().ok_or("Missing rootHash field")?;
    let path = parsed["path"].as_str().ok_or("Missing path field")?.to_string();
    let siblings = parsed["merkleProof"]["siblings"]
        .as_array()
        .ok_or("Missing siblings field")?
        .iter()
        .map(|sibling| sibling.as_str().ok_or("Invalid sibling format").map(String::from))
        .collect::<Result<Vec<String>, _>>()?;
    let parent_hashes = parsed["merkleProof"]["parentHashes"]
        .as_array()
        .ok_or("Missing parentHashes field")?
        .iter()
        .map(|parent_hash| parent_hash.as_str().ok_or("Invalid parentHashes format").map(String::from))
        .collect::<Result<Vec<String>, _>>()?;

    Ok(vec![DataEntry {
        timestamp: Utc::now().to_rfc3339(),
        user_data_hash: data_hash_hex.to_string(),
        received_data_hash: root_hash_hex.to_string(),
        path,
        merkle_proof: MerkleProof {
            siblings,
            parent_hashes,
        },
    }])
}

fn generate_proof(data_entries: &[DataEntry]) -> Result<String, Box<dyn Error>> {
    let mut csprng = thread_rng();
    let params = groth16::generate_random_parameters::<Bls12, _, _>(
        DataVerificationEntry {
            frontend_hash: Fr::one(),
            backend_hash: Fr::one(),
            new_data_commitment: Fr::one(),
            existing_data_commitments: vec![Fr::one()],
        },
        &mut csprng,
    )?;

    // More detailed logging to track the flow of execution
    println!("Generated parameters for proof generation");

    let proofs = data_entries.iter().map(|entry| {
        let user_data_hash_bytes = hex::decode(&entry.user_data_hash)?;
        let received_data_hash_bytes = hex::decode(&entry.received_data_hash)?;

        let frontend_hash = bytes_to_fr(&user_data_hash_bytes)?;
        let backend_hash = bytes_to_fr(&received_data_hash_bytes)?;

        let circuit = DataVerificationEntry {
            frontend_hash,
            backend_hash,
            new_data_commitment: frontend_hash,
            existing_data_commitments: vec![backend_hash],
        };

        let proof = groth16::create_random_proof(circuit, &params, &mut csprng)?;
        Ok(format!("Proof: {:?}", proof))
    }).collect::<Result<Vec<_>, Box<dyn Error>>>()?;

    Ok(proofs.join(", "))
}

#[marine]
pub fn entryThis(theData: String) -> String {
    // More detailed logging to track the flow of execution
    println!("Received data for entry: {:?}", theData);

    let data_entries = match setup_static_data_entries(&theData) {
        Ok(entries) => entries,
        Err(err) => {
            // Error occurred while setting up data entries
            println!("Error setting up data entries: {:?}", err);
            return format!("Error: {:?}", err);
        }
    };

    let proof_result = match generate_proof(&data_entries) {
        Ok(proof) => proof,
        Err(err) => {
            // Error occurred while generating proof
            println!("Error generating proof: {:?}", err);
            return format!("Error: {:?}", err);
        }
    };

    format!("Hi, {:?}", proof_result)
}
