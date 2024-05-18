extern crate bellman;
extern crate pairing;
extern crate rand;
extern crate serde;
extern crate serde_derive;
extern crate serde_json;

use bellman::{groth16, Circuit, ConstraintSystem, SynthesisError};
use pairing::bls12_381::{Bls12, Fr};
use rand::rngs::OsRng;
use serde_derive::{Deserialize, Serialize};
use serde_json::Error as SerdeError;
use std::str::FromStr;

#[derive(Serialize, Deserialize, Debug)]
struct LogEntry {
    timestamp: String,
    ip: String,
    method: String,
    path: String,
    status: u16,
}

struct LogCircuit {
    pub status: Fr,
}

impl Circuit<Fr> for LogCircuit {
    fn synthesize<CS: ConstraintSystem<Fr>>(self, cs: &mut CS) -> Result<(), SynthesisError> {
        let status_var = cs.alloc(|| "status", || Ok(self.status))?;

        let expected_status = Fr::from_str("200")?;
        cs.enforce(
            || "check status is 200",
            |lc| lc + status_var,
            |lc| lc + CS::one(),
            |_| expected_status.into(),
        );

        Ok(())
    }
}

pub fn generate_proof(log_entries_json: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let log_entries: Vec<LogEntry> = serde_json::from_str(log_entries_json)?;

    let rng = &mut OsRng;

    let params = groth16::generate_random_parameters::<Bls12, _, _>(
        LogCircuit {
            status: Fr::from_str("0")?,
        },
        rng,
    )?;

    let proofs = log_entries
        .iter()
        .map(|entry| {
            let status = Fr::from_str(&entry.status.to_string())?;
            let circuit = LogCircuit { status };
            let proof = groth16::create_random_proof(circuit, &params, rng)?;
            let proof_bytes = proof.write_to_bytes()?;
            Ok(proof_bytes)
        })
        .collect::<Result<Vec<_>, SynthesisError>>()?;

    Ok(proofs.concat())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_generates_proof() {
        let json_data = r#"
            [
                {
                    "timestamp": "2023-05-17T12:34:00Z",
                    "ip": "192.168.1.25",
                    "method": "GET",
                    "path": "/index.html",
                    "status": 200
                },
                {
                    "timestamp": "2023-05-17T12:35:00Z",
                    "ip": "192.168.1.26",
                    "method": "POST",
                    "path": "/login",
                    "status": 500
                }
            ]
        "#;

        let result = generate_proof(json_data);
        assert!(result.is_ok());
    }
}
