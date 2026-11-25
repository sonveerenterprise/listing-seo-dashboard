"use client";
import { useState } from "react";
import Icon from "./Icon";

/** Opens and closes the left menu (phones) or hides it (desktop). */
export default function MenuButton() {
  const [on, setOn] = useState(false);
  return (
    <button type="button" className="iconbtn" aria-label="Menu" aria-expanded={on} onClick={() => setOn(document.getElementById("shell")!.classList.toggle("navtoggle"))}>
      <Icon name="menu" />
    </button>
  );
}
