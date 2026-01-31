import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import * as MediaLibrary from "expo-media-library";
import { useState, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import * as AC from "@bacons/apple-colors";
import { useColorScheme } from "react-native";

type PhysicalCameraDevice = "ultra-wide-angle-camera" | "wide-angle-camera" | "telephoto-camera";

export default function CameraScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [selectedDeviceType, setSelectedDeviceType] = useState<PhysicalCameraDevice>("wide-angle-camera");
  const device = useCameraDevice("back", { physicalDevices: [selectedDeviceType] });
  const cameraRef = useRef<Camera>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const availableDeviceTypes: PhysicalCameraDevice[] = [
    "ultra-wide-angle-camera",
    "wide-angle-camera",
    "telephoto-camera"
  ];

  if (!hasPermission) {
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

  if (!device) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? AC.systemBackground : AC.systemBackground }]}>
        <Text style={{ color: isDark ? AC.label : AC.label }}>Loading camera...</Text>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePhoto({
          qualityPrioritization: "quality",
          enableShutterSound: true,
        });

        // Request media library permission if not granted
        if (!mediaPermission?.granted) {
          const { status } = await requestMediaPermission();
          if (status !== "granted") {
            Alert.alert("Permission Required", "Please grant access to save photos to camera roll");
            return;
          }
        }

        // Save to camera roll
        await MediaLibrary.saveToLibraryAsync(`file://${photo.path}`);
        Alert.alert("Photo Saved!", "Photo has been saved to your camera roll", [{ text: "OK" }]);
      } catch (error) {
        Alert.alert("Error", `Failed to take picture: ${error}`);
      }
    }
  };

  const handleLensChange = (deviceType: PhysicalCameraDevice) => {
    console.log("Switching to device:", deviceType);
    setSelectedDeviceType(deviceType);
  };

  const getDeviceLabel = (deviceType: PhysicalCameraDevice) => {
    switch (deviceType) {
      case "ultra-wide-angle-camera":
        return "Ultra Wide (0.5x)";
      case "wide-angle-camera":
        return "Wide (1x)";
      case "telephoto-camera":
        return "Telephoto (2-3x)";
    }
  };

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={true}
        photo={true}
      />
      <View style={styles.controlsContainer}>
        <View style={styles.topControls}>
          <Text style={[styles.title, { color: "white" }]}>Camera Selection</Text>
          <Text style={[styles.subtitle, { color: AC.systemGray6 }]}>
            Current: {getDeviceLabel(selectedDeviceType)}
          </Text>
        </View>

        <View style={styles.bottomControls}>
          <View style={styles.cameraSelector}>
            {availableDeviceTypes.map((deviceType) => (
              <Pressable
                key={deviceType}
                onPress={() => handleLensChange(deviceType)}
                style={({ pressed }) => [
                  styles.cameraSelectorButton,
                  {
                    backgroundColor:
                      selectedDeviceType === deviceType
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
                      fontWeight: selectedDeviceType === deviceType ? "700" : "500",
                    },
                  ]}
                >
                  {getDeviceLabel(deviceType)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
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
