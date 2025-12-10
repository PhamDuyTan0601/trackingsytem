import { useEffect } from "react";
import { useMap } from "react-leaflet";

function MapUpdater({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, 16);
    }
  }, [center, map]);

  return null;
}

export default MapUpdater;
