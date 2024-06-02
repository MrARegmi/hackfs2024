use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use csv::ReaderBuilder;
use serde_json::Value;
use poseidon_rs::poseidon;

#[derive(Serialize, Deserialize)]
struct TransactionRecord {
    transaction_id: u32,
    date: String,
    customer_id: u32,
    amount: f64,
    #[serde(rename = "type")]
    type_: String,
    description: String,
}

#[derive(Serialize, Deserialize)]
struct ProcessedTransactions {
    processed_transactions: String,
    hash: Vec<u8>, // Hash as a vector of bytes
}

#[wasm_bindgen]
pub fn process_and_hash_csv(csv_data: &str) -> String {
    // Prepare the CSV reader and iterate over each record.
    let mut reader = ReaderBuilder::new()
        .has_headers(true)
        .from_reader(csv_data.as_bytes());
    let mut records: Vec<TransactionRecord> = Vec::new();
    for result in reader.deserialize() {
        if let Ok(record) = result {
            records.push(record);
        }
    }

    // Serialize the records into a JSON string
    let transactions_json = serde_json::to_string(&records).unwrap();

    // Serialize the JSON string to a Value
    let json_value: Value = serde_json::from_str(&transactions_json).unwrap();

    // Hash the JSON value using the Poseidon hash function
    let hash = poseidon::poseidon(&json_value);

    // Serialize the processed data and the byte array hash to JSON
    serde_json::to_string(&ProcessedTransactions {
        processed_transactions: transactions_json,
        hash,
    })
    .unwrap()
}