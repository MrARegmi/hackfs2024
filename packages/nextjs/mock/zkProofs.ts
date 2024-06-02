// Define the structure of the proof data
interface ProofData {
  x: string | string[];
  y: string | string[];
}

// Define the shape of the state
interface State {
  proof: {
    a: ProofData;
    b: ProofData;
    c: ProofData;
  };
  description: string;
}

export const zkProofs: State = {
  proof: {
    a: {
      x: "0x10ab988d9dae331b9ad83b7a850471c880b4c73ba50c5d5cdc405e73c1cf9581f7844659d6443cac91dba42e730e994c",
      y: "0x1094d57523b687dbf265890ada94d7d819a7d7e015912f63046b9fdf0f722ec6d7b112741144ab8f5c57a9ac1632595c",
    },
    b: {
      x: [
        "0x0109ac3b8ebf8f7cfb25f22d720b3167bf5854e9b5655f7fa5d0b2b8b9638824a4d099028d29905dfba590d9a3e4ef68",
        "0x1949f478b342d616e191c90b6527071ee9cdca2287a8cf05a01aa1fb4a1637e27fdfa1aa457a42581593aec7e8dfab19",
      ],
      y: [
        "0x02a517bbb30b82eb905bc69f4bca2a42383ac5884d6fcfc3f87bf32281f2ecd1c04c92c21d141975776d1d1ededdcfee",
        "0x18bf106b73f82291279c92febbc9823ab6c5ccf69e6699412221676cfbea54dfdf2d5a822abdcdb5d8a4f4ba63c4376f",
      ],
    },
    c: {
      x: "0x14c6de59f07baa9b366f20fd80a78fed888e8dad03e308166b4abd4b6a21c6876d9d1678223c47c62a5b4bd8322f4f74",
      y: "0x08078dbb062607e99bd8a2ebfca228b487dea85007740e994834df5a975a23af50e8ab199793f47be4c7bf52b919780a",
    },
  },
  description:
    "This proof verifies that I have performed a secret computation without revealing the inputs or outputs. It ensures the integrity and correctness of the computation under the zero-knowledge property, allowing for the verification of data authenticity without exposing the actual data.",
};
