package com.example

import com.facebook.react.bridge.ReactApplicationContext

// Migrated to the New Architecture: extends the codegen-generated spec.
class ModernModule(reactContext: ReactApplicationContext) :
  NativeModernModuleSpec(reactContext) {
  override fun getName() = "ModernModule"
}
