import React, { useEffect } from "react";
import TableComponent from "../Components/TableComponent";
import { useRecoilState } from "recoil";
import { rowDataState } from "../Atom/rowDataState";

// Define Recoil Atom

export default function Item() {
  const [rowData, setRowData] = useRecoilState(rowDataState);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://api-assignment.inveesync.in/items",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();

        // Update the Recoil state only once
        setRowData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [setRowData]); // Ensure that useEffect runs only once by providing an empty dependency array

  return (
    <div>
      {rowData.length === 0 ? ( // Handle the loading state
        <p>Loading data...</p>
      ) : (
        <TableComponent data={rowData} />
      )}
    </div>
  );
}
