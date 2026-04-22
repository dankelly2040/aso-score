import { View } from "react-native";
import ASOScoreDOM from "../components/ASOScoreDOM";

export default function Home() {
  return (
    <View style={{ flex: 1 }}>
      <ASOScoreDOM dom={{ style: { flex: 1, width: "100%", height: "100%" } }} />
    </View>
  );
}
