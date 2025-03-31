// import React from "react";
// import "./ContactCard.css";
// const ContactCard = ({ contact, onMoveToNextStage }) => {
//   return (
//     <div className="contact-card">
//       <div className="contact-details">
//         <h3 className="contact-name">{contact.name}</h3>
//         <p>Email: {contact.email || "N/A"}</p>
//         <p>Phone: {contact.phone || "N/A"}</p>
//         <p>Amount: ₹{contact.amount || "0"}</p>
//         <p>Date: {contact.when || "N/A"}</p>
//         <button
//           className="move-btn"
//           onClick={() => onMoveToNextStage(contact.id, contact.currentStage)}
//         >
//           Move to Next Stage
//         </button>
//       </div>
//     </div>
//   );
// };
// export default ContactCard;