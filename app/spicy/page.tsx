import valentines from "../../public/valentines.json";
import ValentineGrid from "../components/ValentineGrid";

export default function SpicyHome() {
  return <ValentineGrid initialValentines={valentines.spicy} basePath="/spicy" />;
}
