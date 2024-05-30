use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use csv::ReaderBuilder;
use sha2::{Sha256, Digest};

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
    hash: Vec<u8>,  // Hash as a vector of bytes
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

    // Create a new SHA256 object and process the JSON string
    let mut hasher = Sha256::new();
    hasher.update(transactions_json.as_bytes());
    let hash_result = hasher.finalize(); // This gives us the hash as a fixed-size array

    // Convert the fixed-size array to a Vec<u8> to be JSON serializable
    let hash_bytes = hash_result.iter().cloned().collect::<Vec<u8>>();

    // Serialize the processed data and the byte array hash to JSON
    serde_json::to_string(&ProcessedTransactions {
        processed_transactions: transactions_json,
        hash: hash_bytes
    }).unwrap()
}
