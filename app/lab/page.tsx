"use client";

import styles from "./page.module.scss";
import { useState, useEffect } from "react";
import { Lab } from "@/lib/types";
import { client } from "@/sanity/lib/client";
import { labQueries } from "@/lib/queries/lab.queries";
import InfiniteCanvas from "@/components/InfiniteCanvas/InfiniteCanvas";

const LabPage = () => {
  const [labs, setLabs] = useState<Lab[]>([]);

  useEffect(() => {
    const fetchLabs = async () => {
      const data = await client.fetch(labQueries.all);
      setLabs(data);
    };
    fetchLabs();
  }, []);

  return (
    <div className={styles.lab}>
      <InfiniteCanvas labs={labs} />
    </div>
  );
};

export default LabPage;