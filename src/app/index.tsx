import { CameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import * as AC from "@bacons/apple-colors";
import { useColorScheme } from "react-native";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [selectedLens, setSelectedLens] = useState<string | undefined>(undefined);
  const [availableLenses, setAvailableLenses] = useState<string[]>([]);
  const [pictureSize, setPictureSize] = useState<string | undefined>(undefined);
  const cameraRef = useRef<CameraView>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleAvailableLensesChanged = (event: any) => {
    console.log("Available lenses event:", event);
    const lenses = event?.lenses || event?.nativeEvent?.availableLenses || event?.availableLenses || event || [];
    console.log("Parsed lenses:", lenses);

    if (Array.isArray(lenses) && lenses.length > 0) {
      setAvailableLenses(lenses);
      // Set default lens if not already set
      if (!selectedLens) {
        // Try to find the standard wide lens, or use the first one
        const wideLens = lenses.find((l: string) => l.toLowerCase().includes("back") && !l.toLowerCase().includes("ultra") && !l.toLowerCase().includes("telephoto") && !l.toLowerCase().includes("dual"));
        setSelectedLens(wideLens || lenses[0]);
      }
    }
  };

  // Try to get available lenses and picture sizes when camera is ready
  useEffect(() => {
    const initializeCamera = async () => {
      if (cameraRef.current) {
        try {
          // Get available lenses
          const lenses = await cameraRef.current.getAvailableLensesAsync();
          console.log("Manually fetched lenses:", lenses);
          if (lenses && lenses.length > 0) {
            setAvailableLenses(lenses);
            if (!selectedLens) {
              const wideLens = lenses.find((l: string) => l.toLowerCase().includes("back") && !l.toLowerCase().includes("ultra") && !l.toLowerCase().includes("telephoto"));
              setSelectedLens(wideLens || lenses[0]);
            }
          }

          // Get available picture sizes and select the largest
          const sizes = await cameraRef.current.getAvailablePictureSizesAsync();
          console.log("Available picture sizes:", sizes);
          if (sizes && sizes.length > 0) {
            // Typically the largest size is the last one or has the highest resolution
            // Parse sizes (format like "4032x3024") and find the largest
            const sortedSizes = sizes.sort((a: string, b: string) => {
              const [aWidth, aHeight] = a.split('x').map(Number);
              const [bWidth, bHeight] = b.split('x').map(Number);
              return (bWidth * bHeight) - (aWidth * aHeight);
            });
            const largestSize = sortedSizes[0];
            console.log("Selected picture size:", largestSize);
            setPictureSize(largestSize);
          }
        } catch (error) {
          console.log("Error initializing camera:", error);
        }
      }
    };

    // Wait a bit for camera to be ready
    const timer = setTimeout(initializeCamera, 500);
    return () => clearTimeout(timer);
  }, [permission?.granted]);

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
          skipProcessing: false, // Ensure proper orientation
        });

        if (photo) {
          // Request media library permission if not granted
          if (!mediaPermission?.granted) {
            const { status } = await requestMediaPermission();
            if (status !== "granted") {
              Alert.alert("Permission Required", "Please grant access to save photos to camera roll");
              return;
            }
          }

          // Save to camera roll
          await MediaLibrary.saveToLibraryAsync(photo.uri);
          Alert.alert("Photo Saved!", "Photo has been saved to your camera roll", [{ text: "OK" }]);
        }
      } catch (error) {
        Alert.alert("Error", `Failed to take picture: ${error}`);
      }
    }
  };

  const handleLensChange = (lens: string) => {
    console.log("Switching to lens:", lens);
    setSelectedLens(lens);
  };

  const getLensLabel = (lens: string) => {
    // Use the actual lens name from iOS, and add zoom indicators
    const lowerLens = lens.toLowerCase();
    if (lowerLens.includes("ultra")) {
      return `${lens} (0.5x)`;
    } else if (lowerLens.includes("telephoto")) {
      return `${lens} (2-3x)`;
    } else {
      return `${lens} (1x)`;
    }
  };

  const getShortLensLabel = (lens: string) => {
    const lowerLens = lens.toLowerCase();
    if (lowerLens.includes("ultra")) {
      return "Ultra Wide (0.5x)";
    } else if (lowerLens.includes("telephoto")) {
      return "Telephoto (2-3x)";
    } else {
      return "Wide (1x)";
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
        pictureSize={pictureSize}
        onAvailableLensesChanged={handleAvailableLensesChanged}
      />
      <View style={styles.controlsContainer}>
        <View style={styles.topControls}>
          <Text style={[styles.title, { color: "white" }]}>Camera Selection</Text>
          {selectedLens && (
            <Text style={[styles.subtitle, { color: AC.systemGray6 }]}>
              Current: {getShortLensLabel(selectedLens)}
            </Text>
          )}
        </View>

        <View style={styles.bottomControls}>
          <View style={styles.cameraSelector}>
            {availableLenses.length === 0 ? (
              <Text style={{ color: "white", textAlign: "center" }}>
                Detecting cameras...
              </Text>
            ) : (
              availableLenses.map((lens) => (
                <Pressable
                  key={lens}
                  onPress={() => handleLensChange(lens)}
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
                    {getShortLensLabel(lens)}
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
