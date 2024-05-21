use actix_web::{web, App, HttpResponse, HttpServer};
use bellman::{groth16, Circuit, ConstraintSystem, SynthesisError};
use bls12_381::{Bls12, Scalar as Fr};
use chrono::Utc;
use rand::{Rng, thread_rng};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::convert::TryInto;
use std::error::Error;
use std::time::{SystemTime, UNIX_EPOCH};
use hex;

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

fn parse_static_json_data() -> Result<Vec<DataEntry>, Box<dyn Error>> {
    let json_data = r#"{
        "success": true,
        "message": "Data committed successfully.",
        "dataHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "rootHash": "9b99b4b4b5b7ac802f4f34f1e5b3a12345abcd6789ef01d23456789abcef0123",
        "path": "1.2.4",
        "merkleProof": {
            "siblings": [
                "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
                "3ba3b30af0e1e2e3f4f5f6f7g8g9a1a2b2c3c4d4e5f6f7f8a9ba"
            ],
            "parentHashes": [
                "2c26b46b68ffc68ff99b453c1d304134134787787ff12d34d1e6f2a4c9a6",
                "3e23e8160039594a33894f6564e1b1343937743132513b202b2173c1d00e"
            ]
        }
    }"#;

    let parsed: serde_json::Value = serde_json::from_str(json_data)?;
    let data_hash_hex = parsed["dataHash"].as_str().unwrap_or("").to_string();
    let root_hash_hex = parsed["rootHash"].as_str().unwrap_or("").to_string();
    let path = parsed["path"].as_str().unwrap_or("").to_string();
    let siblings = parsed["merkleProof"]["siblings"]
        .as_array()
        .unwrap_or(&Vec::new())
        .iter()
        .map(|sibling| sibling.as_str().unwrap_or("").to_string())
        .collect();
    let parent_hashes = parsed["merkleProof"]["parentHashes"]
        .as_array()
        .unwrap_or(&Vec::new())
        .iter()
        .map(|parent_hash| parent_hash.as_str().unwrap_or("").to_string())
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

    let proofs = data_entries.iter().map(|entry| {
        let user_data_hash_bytes = hex::decode(&entry.user_data_hash).expect("Decoding hex failed");
        let received_data_hash_bytes = hex::decode(&entry.received_data_hash).expect("Decoding hex failed");

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

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let data_entries = parse_static_json_data().unwrap();

    HttpServer::new(move || {

        App::new()
           .app_data(web::Data::new(data_entries.clone())) // Pass data entries to the app
           .route("/", web::get().to(|| async { HttpResponse::Ok().body("Hello, World!") }))
           .route("/generate_proof", web::get().to(|data: web::Data<Vec<DataEntry>>| async move {
               match generate_proof(&data) {
                   Ok(proof) => HttpResponse::Ok().body(proof),
                   Err(e) => HttpResponse::InternalServerError().body(format!("Error: {:?}", e)),
               }
           }))
   })
   .bind("127.0.0.1:8080")?
   .run()
   .await
}

#[cfg(test)]
mod tests {
   use super::*;

   // Function to simulate the parsing and conversion of static data to test the proof generation
   fn setup_static_data_entries() -> Vec<DataEntry> {
       let json_data = r#"{
           "success": true,
           "message": "Data committed successfully.",
           "dataHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
           "rootHash": "9b99b4b4b5b7ac802f4f34f1e5b3a12345abcd6789ef01d23456789abcef0123",
           "path": "1.2.4",
           "merkleProof": {
               "siblings": [
                   "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
                   "3ba3b30af0e1e2e3f4f5f6f7g8g9a1a2b2c3c4d4e5f6f7f8a9ba"
               ],
               "parentHashes": [
                   "2c26b46b68ffc68ff99b453c1d304134134787787ff12d34d1e6f2a4c9a6",
                   "3e23e8160039594a33894f6564e1b1343937743132513b202b2173c1d00e"
               ]
           }
       }"#;
       let parsed: serde_json::Value = serde_json::from_str(json_data).unwrap();
       let data_hash_hex = parsed["dataHash"].as_str().unwrap();
       let root_hash_hex = parsed["rootHash"].as_str().unwrap();
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
           user_data_hash: data_hash_hex.to_string(),
           received_data_hash: root_hash_hex.to_string(),
           path,
           merkle_proof: MerkleProof {
               siblings,
               parent_hashes,
           },
       }]
   }

   #[test]
   fn test_generate_proof_with_static_data() {
       let data_entries = setup_static_data_entries();
       let proof_result = generate_proof(&data_entries);

       match &proof_result {  // Use a reference to the original proof_result to avoid moving it
           Ok(proof) => println!("Generated Proof: {}", proof),
           Err(ref e) => println!("Error generating proof: {:?}", e),  // Changed to `ref e` to borrow rather than move
       }

       assert!(proof_result.is_ok(), "The proof generation should complete successfully.");
   }
}