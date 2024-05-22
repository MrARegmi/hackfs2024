#![allow(non_snake_case)]
use marine_rs_sdk::marine;
use marine_rs_sdk::module_manifest;

module_manifest!();

pub fn main() {}

fn simple_hash(input: &str) -> u64 {
    input.bytes().map(|b| b as u64).sum()
}

#[marine]
pub fn add_and_hash(num1: i32, num2: i32) -> String {
    let sum = num1 + num2;
    let sum_str = sum.to_string();
    let hash = simple_hash(&sum_str);
    format!("Clear text: {}, Hash: {}", sum, hash)
}
