import valentines from "../public/valentines.json";
import ValentineGrid from "./components/ValentineGrid";

export default function Home() {
  return <ValentineGrid initialValentines={valentines.mild} basePath="" />;
}
