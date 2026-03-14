import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./Visualization.css";


import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { Navigate, useNavigate } from "react-router-dom";
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const GEO_DICTIONARY = {
  "Edinburgh": [55.9533, -3.1883],
  "Tokyo": [35.6762, 139.6503],
  "San Francisco": [37.7749, -122.4194],
  "London": [51.5074, -0.1278],
  "New York": [40.7128, -74.006],
};

const Visualization = () => {
  const [empData, setEmpData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [dynamicGeoDict, setDynamicGeoDict] = useState({});
  const [isGeocoding, setIsGeocoding] = useState(false);

  const navigate=useNavigate();

  // THE INTENTIONAL VULNERABILITY: Stale Closure & Memory Leak
  // We need to remove the two commented lines to fix the bug
  useEffect(() => {
    let timerId=1;
    if (autoRefresh) {
      timerId = setInterval(() => {
        console.log(`Polling API... Current refresh count is: ${refreshCount}`);
        setRefreshCount(refreshCount+ 1); 

      }, 300);
    }
    // return () => {clearInterval(timerId);}
  }, [autoRefresh,
    // refreshCount
  ]); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetch(
          "https://backend.jotish.in/backend_dev/gettabledata.php",
          {
            method: "POST",
            body: JSON.stringify({
              username: "test",
              password: "123456",
            }),
          }
        );
        const res = await data.json();
        setEmpData(res?.TABLE_DATA?.data || []);
      } catch (error) {
        console.error("Failed to fetch visualization data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchCoordinates = async () => {
      if (!empData.length) return;
      setIsGeocoding(true);

      const uniqueCities = [...new Set(empData.map((row) => row[2]))];
      const newDict = {};
      for (const city of uniqueCities) {
        if (!city || newDict[city]) continue;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&format=json`
          );
          const data = await response.json();

          if (data && data.length > 0) {
            newDict[city] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          } else {
            newDict[city] = [0, 0]; 
          }
          await new Promise((resolve) => setTimeout(resolve, 300));
          
        } catch (error) {
          console.error(`Geocoding failed for ${city}:`, error);
          newDict[city] = GEO_DICTIONARY[city] || [0,0];
        }
      }

      setDynamicGeoDict(newDict);
      setIsGeocoding(false);
    };

    fetchCoordinates();
  }, [empData]);

  const cityData = useMemo(() => {
    if (!empData.length || Object.keys(dynamicGeoDict).length === 0) return [];

    const aggregated = {};

    empData.forEach((row) => {
      if (row.length < 6) return; 
      
      const city = row[2];
      const rawSalary = parseFloat(row[5].replace(/[^0-9.-]+/g, ""));

      if (!aggregated[city]) {
        aggregated[city] = { 
          totalSalary: 0, 
          count: 0, 
          coords: dynamicGeoDict[city] || [0, 0] 
        };
      }
      aggregated[city].totalSalary += rawSalary;
      aggregated[city].count += 1;
    });

    return Object.entries(aggregated).map(([city, stats]) => ({
      city,
      avgSalary: stats.totalSalary / stats.count,
      coords: stats.coords,
    }));
  }, [empData, dynamicGeoDict]);

  const SVG_HEIGHT = 250;
  const SVG_WIDTH = Math.max(600, cityData.length * 100); 
  const BAR_WIDTH = 40;
  const SPACING = 60;
  
  const maxSalary = cityData.length > 0 ? Math.max(...cityData.map((d) => d.avgSalary)) : 1;
  const scaleY = (SVG_HEIGHT - 40) / maxSalary; 

  if (isLoading || isGeocoding) {
    return (
      <div className="viz-container">
        <h2>{isGeocoding ? "Loading the City coordinates Data..." : "Loading Analytics..."}</h2>
      </div>
    );
  }
  return (
    <div className="viz-container">

      <button
          onClick={() => navigate("/list")}
          style={{
            height: "40px",
            width: "120px",
            position: "fixed",
            right: "30px",
            top: "100px",
            backgroundColor:"green",
            padding:"6px"
          }}
          >
          Home
        </button>
      
      <h2 className="viz-title">Data Analytics Dashboard</h2>

      <div className="viz-card" style={{ overflowX: "auto" }}>
        <h3>Average Salary per City (Custom SVG)</h3>
        <div className="svg-wrapper">
          <svg width={SVG_WIDTH} height={SVG_HEIGHT} className="custom-svg">
            {cityData.map((dataPoint, index) => {
              const barHeight = dataPoint.avgSalary * scaleY;
              const xPos = index * (BAR_WIDTH + SPACING) + 30;
              const yPos = SVG_HEIGHT - barHeight - 20;

              return (
                <g key={dataPoint.city} className="svg-group">
                  <rect
                    x={xPos}
                    y={yPos}
                    width={BAR_WIDTH}
                    height={barHeight}
                    fill="#10b981"
                    rx="4"
                  />
                  <text x={xPos + BAR_WIDTH / 2} y={SVG_HEIGHT} textAnchor="middle" fill="#a1a1aa" fontSize="12">
                    {dataPoint.city}
                  </text>
                  <text x={xPos + BAR_WIDTH / 2} y={yPos - 8} textAnchor="middle" fill="#f4f4f5" fontSize="12" fontWeight="bold">
                    ${Math.round(dataPoint.avgSalary / 1000)}k
                  </text>
                  
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* LEAFLET MAP IMPLEMENTATION */}
      <div className="viz-card">
        <h3>Geospatial Distribution</h3>
        <div className="map-wrapper">
          <MapContainer center={[30, 0]} zoom={2} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {cityData.map((dataPoint) => {
              if (dataPoint.coords[0] === 0 && dataPoint.coords[1] === 0) return null;
              
              return (
                <Marker position={dataPoint.coords} key={dataPoint.city}>
                  <Popup>
                    <strong>{dataPoint.city}</strong><br />
                    Avg Salary: ${Math.round(dataPoint.avgSalary).toLocaleString()}
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* BUG */}
      <div style={{ padding: "10px", backgroundColor: "#27272a", borderRadius: "6px", marginBottom: "20px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
          <input 
            type="checkbox" 
            checked={autoRefresh} 
            onChange={(e) => setAutoRefresh(e.target.checked)} 
          />
          Enable Live Data Auto-Refresh (Bugged)
        </label>
        <p style={{ fontSize: "16px", color: "#a1a1aa", margin: "5px 0 0 0" }}>
          Refresh cycles executed: {refreshCount}
        </p>
      </div>
    </div>
  );
};

export default Visualization;