import { useState, useEffect, useMemo } from "react";
import "./App.css";
import EmpListCard from "./components/EmpListCard";

const card_height = 120;
const total_height = window.innerHeight * 0.9;
const buffer_cards = 5;

function App() {
  const [empData, setEmpData] = useState([]);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetch(
        "https://backend.jotish.in/backend_dev/gettabledata.php",
        {
          method: "POST",
          body: JSON.stringify({
            username: "test",
            password: "123456",
          }),
        },
      );
      const res = await data.json();
      setEmpData(res?.TABLE_DATA?.data || []);
    };
    fetchData();
  }, []);
  console.log(empData);
  const handleScroll = (e) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const startIndex = Math.max(0, Math.floor(scrollTop / card_height) - buffer_cards);
  const endIndex = Math.min(
    empData.length - 1,
    Math.floor((scrollTop + total_height) / card_height) + buffer_cards,
  );

  const visibleItems = useMemo(() => {
    return empData.slice(startIndex, endIndex + 1);
  }, [empData, startIndex, endIndex]);
  const totalHeight = empData.length * card_height;
  const offsetY = startIndex * card_height;

  return (
    <div
      style={{ height: `${total_height}px`, overflowY: "auto" }}
      onScroll={handleScroll}
    >
      <div style={{ position: "fixed", left: "45%", top: "5%" , zIndex:"20"}}>
      <div style={{backgroundColor:"black", padding:"10px", borderRadius:"18px"}}>
        Items Visible : {endIndex}
      </div>
      </div>
      <div
        style={{
          height: `${totalHeight}px`,
          position: "relative",
          marginTop: "100px",
        }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            width: "95%",
            padding:"20px"
          }}
        >
          {visibleItems.map((e, index) => {
            const actualIndex = startIndex + index;
            return <EmpListCard key={actualIndex} e={e} i={actualIndex} />;
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
