// flags.ts
import { statsigAdapter, type StatsigUser } from "@flags-sdk/statsig";
import { flag, dedupe } from "flags/next";
import type { Identify } from "flags";

// Función identify que proporciona un objeto de usuario para cualquier solicitud
// Los atributos del usuario se utilizan para verificar el flag contra sus reglas
export const identify = dedupe((async () => ({
  // Implementar la función identify() para agregar propiedades adicionales del usuario
  // Ver docs.statsig.com/concepts/user para más información
  userID: "1234", // Por ejemplo, establecer userID
  // Puedes agregar más propiedades como:
  // email: "user@example.com",
  // country: "US",
  // customAttributes: {}
})) satisfies Identify<StatsigUser>);

// Función para crear feature flags
export const createFeatureFlag = (key: string) => flag<boolean, StatsigUser>({
  key,
  adapter: statsigAdapter.featureGate((gate) => gate.value, { exposureLogging: true }),
  identify,
});

// Ejemplo de uso de feature flags específicos
export const myFeatureFlag = createFeatureFlag("my_feature_flag");
export const avatarUploadFlag = createFeatureFlag("avatar_upload_enabled");
export const chatInterfaceFlag = createFeatureFlag("chat_interface_v2");
export const premiumFeaturesFlag = createFeatureFlag("premium_features_enabled");