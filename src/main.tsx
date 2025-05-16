import React from "react";
import ReactDOM from "react-dom/client";
import "./main.css";
import SnapWeb from "./components/SnapWeb";
import { useHashLocation } from "wouter/use-hash-location";
import { Router, Route } from "wouter";
import Group from "./components/Group";
import { SnapcastProvider } from "./use-snapcast";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

console.log(
  `Welcome to ${import.meta.env.VITE_APP_NAME} ${import.meta.env.VITE_APP_VERSION}`,
);

root.render(
  <React.StrictMode>
    <SnapcastProvider>
      <div className="w-full px-4 max-w-[90ch] m-auto relative">
        <Router base="/" hook={useHashLocation}>
          <Route path="/" component={SnapWeb} />
          <Route path="/:groupId" component={Group} />
        </Router>
      </div>
    </SnapcastProvider>
  </React.StrictMode>,
);
