import { Camera, useCameraDevice, useCameraDevices, useCameraFormat, useCameraPermission, CameraDevice } from "react-native-vision-camera";
import * as MediaLibrary from "expo-media-library";
import { useState, useRef, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import * as AC from "@bacons/apple-colors";
import { useColorScheme } from "react-native";

export default function CameraScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const devices = useCameraDevices();
  const [selectedDevice, setSelectedDevice] = useState<CameraDevice | undefined>(undefined);
  const cameraRef = useRef<Camera>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Get all back cameras - filter to only physical single cameras
  const backCameras = useMemo(() => {
    if (!devices) return [];

    const backDevices = devices.filter(d => d.position === "back");

    // Log all devices for debugging
    console.log("All back devices:", backDevices.map(d => ({
      id: d.id,
      name: d.name,
      physicalDevices: d.physicalDevices,
      devices: d.devices
    })));

    // Filter to only physical cameras (not virtual/dual cameras)
    // A physical camera has exactly one physical device type
    const physicalCameras = backDevices.filter(d => {
      const physicalDevices = d.physicalDevices || [];
      return physicalDevices.length === 1;
    });

    console.log("Physical cameras:", physicalCameras.map(d => ({
      id: d.id,
      name: d.name,
      physicalDevices: d.physicalDevices
    })));

    return physicalCameras;
  }, [devices]);

  // Use selected device or default to first back camera
  const device = selectedDevice || backCameras[0];

  // Select the best format for maximum photo quality AND good preview
  const format = useCameraFormat(device, [
    { photoResolution: 'max' },
    { videoResolution: 'max' },
    { fps: 30 },
  ]);

  // Log format information for debugging
  useMemo(() => {
    if (format) {
      console.log("Selected format:", {
        photoWidth: format.photoWidth,
        photoHeight: format.photoHeight,
        videoWidth: format.videoWidth,
        videoHeight: format.videoHeight,
        videoStabilizationModes: format.videoStabilizationModes,
        maxISO: format.maxISO,
        maxFps: format.maxFps,
      });
    }
  }, [format]);

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
          flash: "off",
          enableShutterSound: true,
          enableAutoRedEyeReduction: true,
          enableAutoDistortionCorrection: true,
          enablePrecapture: true,
        });

        console.log("Photo taken:", {
          path: photo.path,
          width: photo.width,
          height: photo.height,
          orientation: photo.orientation,
          isMirrored: photo.isMirrored,
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
      } catch (error) {
        Alert.alert("Error", `Failed to take picture: ${error}`);
      }
    }
  };

  const handleLensChange = (device: CameraDevice) => {
    console.log("Switching to device:", device.name);
    setSelectedDevice(device);
  };

  const getDeviceLabel = (device: CameraDevice) => {
    const physicalDevices = device.physicalDevices || [];
    const deviceTypes = physicalDevices.join(", ");

    // Try to determine zoom level from device types
    if (physicalDevices.includes("ultra-wide-angle-camera")) {
      return `Ultra Wide (0.5x)`;
    } else if (physicalDevices.includes("telephoto-camera")) {
      return `Telephoto (${device.minZoom}x-${device.maxZoom}x)`;
    } else if (physicalDevices.includes("wide-angle-camera")) {
      return `Wide (1x)`;
    }

    // Fallback to device name
    return device.name || "Camera";
  };

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        format={format}
        isActive={true}
        photo={true}
        video={false}
        preview={true}
        resizeMode="cover"
        enableZoomGesture={false}
        videoStabilizationMode="cinematic-extended"
        enableLocation={true}
      />
      <View style={styles.controlsContainer}>
        <View style={styles.topControls}>
          <Text style={[styles.title, { color: "white" }]}>Camera Selection</Text>
          {device && (
            <Text style={[styles.subtitle, { color: AC.systemGray6 }]}>
              Current: {getDeviceLabel(device)}
            </Text>
          )}
        </View>

        <View style={styles.bottomControls}>
          <View style={styles.cameraSelector}>
            {backCameras.length === 0 ? (
              <Text style={{ color: "white", textAlign: "center" }}>
                Detecting cameras...
              </Text>
            ) : (
              backCameras.map((cam) => (
                <Pressable
                  key={cam.id}
                  onPress={() => handleLensChange(cam)}
                  style={({ pressed }) => [
                    styles.cameraSelectorButton,
                    {
                      backgroundColor:
                        device?.id === cam.id
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
                        fontWeight: device?.id === cam.id ? "700" : "500",
                      },
                    ]}
                  >
                    {getDeviceLabel(cam)}
                  </Text>
                </Pressable>
              ))
            )}
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
