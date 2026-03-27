import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";

/* ---------- KEEP SPLASH ---------- */
SplashScreen.preventAutoHideAsync();

/* ---------- RESPONSIVE HELPERS ---------- */
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

const wp = (percent) => (SCREEN_WIDTH * percent) / 100;
const hp = (percent) => (SCREEN_HEIGHT * percent) / 100;
const fs = (size) => (SCREEN_WIDTH / 375) * size;

function MainApp() {
  const [inputUrl, setInputUrl] = useState("");
  const [playing, setPlaying] = useState(false);
  const [rotated, setRotated] = useState(false);

  const player = useVideoPlayer(null);

  /* ---------- HIDE SPLASH WHEN READY ---------- */
  const onLayoutRootView = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  /* ---------- HELPERS ---------- */

  function convertStreamtapeDomain(url) {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes("streamtape.com")) {
        urlObj.hostname = "advertape.net";
      }
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  useEffect(() => {
    if (playing && inputUrl) {
      player.replace(inputUrl);
      player.play();
    }
  }, [playing, inputUrl]);

  async function getStreamTapeLink(url) {
    try {
      const reqURL = url.replace("/e/", "/v/");
      const resp = await fetch(reqURL);
      if (!resp.ok) throw new Error("HTTP error");

      const data = await resp.text();

      const norobot =
        /document\.getElementById\('norobotlink'\)\.innerHTML = (.+?);/.exec(
          data
        );
      if (!norobot) return null;

      const token = /token=([^&']+)/.exec(norobot[1]);
      if (!token) return null;

      const linkMatch = /id\s*=\s*"ideoooolink"/.exec(data);
      if (!linkMatch) return null;

      const start = data.indexOf(">", linkMatch.index) + 1;
      const path = data.substring(start, data.indexOf("<", start));

      return `https:${path}&token=${token[1]}&dl=1s`;
    } catch {
      return null;
    }
  }

  /* ---------- ACTIONS ---------- */

  const startPlayback = async () => {
    if (!inputUrl.trim()) return;

    const normalizedUrl = convertStreamtapeDomain(inputUrl.trim());
    const directUrl = await getStreamTapeLink(normalizedUrl);

    if (!directUrl) {
      alert("Unable to get video URL.");
      return;
    }

    setInputUrl(directUrl);
    setPlaying(true);
  };

  const toggleRotation = async () => {
    await ScreenOrientation.lockAsync(
      rotated
        ? ScreenOrientation.OrientationLock.PORTRAIT
        : ScreenOrientation.OrientationLock.LANDSCAPE
    );
    setRotated(!rotated);
  };

  const goBack = async () => {
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT
    );
    setRotated(false);
    setPlaying(false);
    player.pause();
  };

  /* ---------- UI ---------- */

  return (
    <SafeAreaView
      style={styles.container}
      onLayout={onLayoutRootView}
    >
      <StatusBar style="light" hidden={playing} />

      {!playing ? (
        <View style={styles.center}>
          <Text style={styles.title}>Streamtape Video Player</Text>

          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Paste Streamtape link"
              placeholderTextColor="#777"
              value={inputUrl}
              onChangeText={setInputUrl}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {inputUrl.length > 0 && (
              <Pressable
                style={styles.clearBtn}
                onPress={() => setInputUrl("")}
              >
                <Text style={styles.clearText}>✕</Text>
              </Pressable>
            )}
          </View>

          <Pressable style={styles.playBtn} onPress={startPlayback}>
            <Text style={styles.playText}>▶ Play</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.videoContainer}>
          <VideoView
            style={styles.video}
            player={player}
            allowsPictureInPicture
            showsTimecodes
            contentFit="contain"
          />

          {/* ✅ FIXED BACK BUTTON */}
          <SafeAreaView style={styles.backSafe}>
            <Pressable style={styles.backBtn} onPress={goBack}>
              <Text style={styles.backText}>⟵ BACK</Text>
            </Pressable>
          </SafeAreaView>

          <Pressable
            style={rotated ? styles.rotateTop : styles.rotateBtn}
            onPress={toggleRotation}
          >
            <Text style={styles.rotateText}>⟳ ROTATE</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ---------- ROOT WRAPPER (IMPORTANT) ---------- */
export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: wp(5),
  },

  title: {
    color: "#fff",
    fontSize: fs(28),
    marginBottom: hp(4),
    fontWeight: "600",
  },

  inputWrapper: {
    width: "100%",
    position: "relative",
    marginBottom: hp(2.5),
  },

  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: wp(3),
    padding: wp(3.5),
    paddingRight: wp(12),
    color: "#fff",
    fontSize: fs(14),
  },

  clearBtn: {
    position: "absolute",
    right: wp(3),
    top: hp(1.2),
    backgroundColor: "rgba(255,255,255,0.15)",
    width: wp(7),
    height: wp(7),
    borderRadius: wp(3.5),
    justifyContent: "center",
    alignItems: "center",
  },

  clearText: { color: "#fff", fontSize: fs(12), fontWeight: "bold" },

  playBtn: {
    backgroundColor: "#1db954",
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(12),
    borderRadius: wp(10),
  },

  playText: { color: "#000", fontSize: fs(18), fontWeight: "bold" },

  videoContainer: { flex: 1, backgroundColor: "#000" },
  video: { width: "100%", height: "100%" },

  /* ✅ SAFE AREA FIX */
  backSafe: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 999,
  },

  backBtn: {
    marginTop: hp(1),
    marginLeft: wp(3),
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(5),
    borderRadius: wp(50),
    elevation: 10,
  },

  backText: { color: "#fff", fontSize: fs(16), fontWeight: "bold" },

  rotateBtn: {
    position: "absolute",
    bottom: hp(10),
    right: wp(5),
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: hp(1.6),
    paddingHorizontal: wp(6),
    borderRadius: wp(8),
  },

  rotateTop: {
    position: "absolute",
    top: hp(2.5),
    right: wp(5),
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: hp(1.6),
    paddingHorizontal: wp(6),
    borderRadius: wp(8),
  },

  rotateText: { color: "#fff", fontSize: fs(15), fontWeight: "600" },
});