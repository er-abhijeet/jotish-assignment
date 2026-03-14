import { Navigate, useNavigate } from "react-router-dom";
import "./EmpListCard.css";

const EmpListCard = ({ e, i }) => {
  const navigate=useNavigate();
  if (!e || e.length < 6) return null;
  const [name, role, location, empId, doj, salary] = e;

  return (
    <div className="emp-card-wrapper" style={{ top: `${i * 120}px` , margin:"0px"}}>
      <div onClick={() => navigate(`/details/${empId}`)} className="emp-card">
        <div className="emp-card-header">
          <h3 className="emp-name">{name}</h3>
          <span className="emp-badge">ID: {empId}</span>
        </div>
        
        <div className="emp-card-body">
          <span className="emp-role">{role}</span>
          <span className="emp-dot">•</span>
          <span className="emp-location">{location}</span>
        </div>
        
        <div className="emp-card-footer">
          <span className="emp-doj">Joined: {doj}</span>
          <span className="emp-salary">{salary}</span>
        </div>
      </div>
    </div>
  );
};

export default EmpListCard;