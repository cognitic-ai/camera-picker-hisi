import { CameraView, useCameraPermissions } from "expo-camera";
import { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import * as AC from "@bacons/apple-colors";
import { useColorScheme } from "react-native";

type CameraLensType = "builtInUltraWideCamera" | "builtInWideAngleCamera" | "builtInTelephotoCamera";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedLens, setSelectedLens] = useState<CameraLensType>("builtInWideAngleCamera");
  const [availableLenses, setAvailableLenses] = useState<CameraLensType[]>([]);
  const cameraRef = useRef<CameraView>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    // Default lenses - we'll update this based on actual availability
    const lenses: CameraLensType[] = [
      "builtInUltraWideCamera",
      "builtInWideAngleCamera",
      "builtInTelephotoCamera"
    ];

    setAvailableLenses(lenses);
  }, []);

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? AC.systemBackground : AC.systemBackground }]}>
        <Text style={{ color: isDark ? AC.label : AC.label }}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? AC.systemBackground : AC.systemBackground }]}>
        <Text style={[styles.message, { color: isDark ? AC.label : AC.label }]}>
          We need your permission to access the camera
        </Text>
        <Pressable
          onPress={requestPermission}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: AC.systemBlue,
              opacity: pressed ? 0.7 : 1
            }
          ]}
        >
          <Text style={[styles.buttonText, { color: "white" }]}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
        });
        Alert.alert("Photo Captured!", `Saved to: ${photo?.uri}`, [{ text: "OK" }]);
      } catch (error) {
        Alert.alert("Error", "Failed to take picture");
      }
    }
  };

  const getLensLabel = (lens: CameraLensType) => {
    switch (lens) {
      case "builtInUltraWideCamera":
        return "Ultra Wide (0.5x)";
      case "builtInWideAngleCamera":
        return "Wide (1x)";
      case "builtInTelephotoCamera":
        return "Telephoto (2x/3x)";
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        key={selectedLens}
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        selectedLens={selectedLens}
      >
        <View style={styles.controlsContainer}>
          <View style={styles.topControls}>
            <Text style={[styles.title, { color: "white" }]}>Camera Selection</Text>
            <Text style={[styles.subtitle, { color: AC.systemGray6 }]}>
              Current: {getLensLabel(selectedLens)}
            </Text>
          </View>

          <View style={styles.bottomControls}>
            <View style={styles.cameraSelector}>
              {availableLenses.map((lens) => (
                <Pressable
                  key={lens}
                  onPress={() => setSelectedLens(lens)}
                  style={({ pressed }) => [
                    styles.cameraSelectorButton,
                    {
                      backgroundColor:
                        selectedLens === lens
                          ? AC.systemBlue
                          : "rgba(255, 255, 255, 0.2)",
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cameraSelectorText,
                      {
                        color: "white",
                        fontWeight: selectedLens === lens ? "700" : "500",
                      },
                    ]}
                  >
                    {getLensLabel(lens)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={takePicture}
              style={({ pressed }) => [
                styles.captureButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={styles.captureButtonInner} />
            </Pressable>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "space-between",
  },
  topControls: {
    paddingTop: 60,
    paddingHorizontal: 20,
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomControls: {
    paddingBottom: 50,
    paddingHorizontal: 20,
    gap: 24,
    alignItems: "center",
  },
  cameraSelector: {
    flexDirection: "column",
    gap: 12,
    width: "100%",
  },
  cameraSelectorButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderCurve: "continuous",
    alignItems: "center",
  },
  cameraSelectorText: {
    fontSize: 17,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    borderWidth: 3,
    borderColor: "black",
  },
  message: {
    textAlign: "center",
    paddingBottom: 20,
    fontSize: 17,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderCurve: "continuous",
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
  },
});
