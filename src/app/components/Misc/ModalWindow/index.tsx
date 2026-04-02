import React from "react";

import "./modalWindow.css";

interface ModalWindowProps {
    children: React.ReactElement,
    onClose: () => void
}

export default function ModalWindow({children, onClose}: ModalWindowProps) {
    return (
        <div id="myModal" className="modal">
            <div className="modal-content">
                <span className="close" onClick={() => {
                    var modal = document.getElementById("myModal");
                    if(modal)
                        modal.style.display = "none";
                    onClose();
                }}>&times;</span>
                <br />
                {children}
            </div>
        </div>
    )
}