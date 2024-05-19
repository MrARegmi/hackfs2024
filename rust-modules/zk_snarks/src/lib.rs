extern crate bellman;
extern crate pairing;
extern crate rand;
extern crate serde;
extern crate serde_derive;
extern crate serde_json;
extern crate actix_web;

use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use bellman::{groth16, Circuit, ConstraintSystem, SynthesisError};
use pairing::bls12_381::{Bls12, Fr};
use rand::rngs::OsRng;
use serde_derive::{Deserialize, Serialize};
use std::str::FromStr;

#[derive(Serialize, Deserialize, Debug)]
struct DataEntry {
    timestamp: String,
    user_data_hash: String,
    received_data_hash: String,
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
        let backend_hash_var = cs.alloc(|| "backend_hash", || Ok(self.backend_hash))?;

        // Enforce hash integrity from frontend to backend
        cs.enforce(
            || "hash integrity check",
            |lc| lc + frontend_hash_var,
            |lc| lc + CS::one(),
            |lc| lc + backend_hash_var,
        );

        // Deduplication checks
        let new_data_commitment_var = cs.alloc_input(|| "new_data_commitment", || Ok(self.new_data_commitment))?;
        for (i, commitment) in self.existing_data_commitments.iter().enumerate() {
            let commitment_var = cs.alloc(|| format!("commitment_{}", i), || Ok(*commitment))?;
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

pub fn generate_proof(data_entries_json: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let data_entries: Vec<DataEntry> = serde_json::from_str(data_entries_json)?;
    let rng = &mut OsRng;
    let params = groth16::generate_random_parameters::<Bls12, _, _>(
        DataVerificationEntry {
            frontend_hash: Fr::from_str("0")?,
            backend_hash: Fr::from_str("0")?,
            new_data_commitment: Fr::from_str("0")?,
            existing_data_commitments: vec![],
        },
        rng,
    )?;

    let proofs = data_entries
        .iter()
        .map(|entry| {
            let frontend_hash = Fr::from_str(&entry.user_data_hash)?;
            let backend_hash = Fr::from_str(&entry.received_data_hash)?;
            // Simulated commitments; you should replace these with actual data logic
            let new_data_commitment = frontend_hash;
            let existing_data_commitments = vec![backend_hash]; // Example, adjust accordingly

            let circuit = DataVerificationEntry {
                frontend_hash,
                backend_hash,
                new_data_commitment,
                existing_data_commitments,
            };
            let proof = groth16::create_random_proof(circuit, &params, rng)?;
            let proof_bytes = proof.write_to_bytes()?;
            Ok(proof_bytes)
        })
        .collect::<Result<Vec<_>, SynthesisError>>()?;

    Ok(proofs.concat())
}

async fn receive_data_entries(data: web::Json<Vec<DataEntry>>) -> impl Responder {
    let json_string = serde_json::to_string(&data.into_inner()).unwrap();
    match generate_proof(&json_string) {
        Ok(proofs) => HttpResponse::Ok().content_type("application/octet-stream").body(proofs),
        Err(e) => HttpResponse::InternalServerError().body(format!("Error generating proof: {:?}", e)),
    }
}

async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/receive_data_entries", web::post().to(receive_data_entries))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
