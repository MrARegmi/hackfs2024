"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { Chrono } from "react-chrono";

const About: NextPage = () => {
  const items = [
    {
      title: "Zero Knowledge Proofs",
      cardTitle: "Zk-Snark Utilization",
      // cardSubtitle:"Zk Snark has been utilized to produce zero-knowledge proofs",
      cardDetailedText:
        "Zk Snark has been utilized to produce zero-knowledge proofsZk Snark has been utilized to produce zero-knowledge proofsZk Snark has been utilized to produce zero-knowledge proofsZk Snark has been utilized to produce zero-knowledge proofs.",
      media: {
        type: "IMAGE",
        source: {
          url: "back.jpg",
        },
      },
    },
    {
      title: "Zero Knowledge Proofs",
      cardTitle: "Zk-Snark Utilization",
      // cardSubtitle:"Zk Snark has been utilized to produce zero-knowledge proofs",
      cardDetailedText:
        "Zk Snark has been utilized to produce zero-knowledge proofsZk Snark has been utilized to produce zero-knowledge proofsZk Snark has been utilized to produce zero-knowledge proofsZk Snark has been utilized to produce zero-knowledge proofs.",
      media: {
        type: "IMAGE",
        source: {
          url: "back.jpg",
        },
      },
    },
  ];
  return (
    <div className="w-screen">
      <div className="blurred-background ">
        <div style={{ width: "1800px", height: "2000px" }}>
          <Chrono
            items={items}
            mode="VERTICAL_ALTERNATING"
            disableToolbar="true"
            theme={{
              primary: "black",
              secondary: "#01C292",
              cardBgColor: "#01C292",
              titleColor: "white",
              titleColorActive: "white",
            }}
            classNames={{
              card: "glass",
              cardMedia: "glass",
              cardSubTitle: "my-card-subtitle",
              cardText: "my-card-text",
              cardTitle: "my-card-title",
              controls: "my-controls",
              title: "my-title",
            }}
          />
        </div>
        {/* <div className="grid grid-cols-2 gap-4">
          <div className="glassy-card p-10">
            <h1 className="text-center mb-8">
              <span className="block text-3xl text-white font-bold">Himalayan Zk Barrier</span>
            </h1>
          </div>
          <div className="glassy-card p-10">
            <h1 className="text-center mb-8">
              <span className="block text-3xl text-white font-bold">Himalayan Zk Barrier</span>
            </h1>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default About;
