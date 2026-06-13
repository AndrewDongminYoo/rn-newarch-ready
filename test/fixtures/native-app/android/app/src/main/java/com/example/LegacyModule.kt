package com.example

import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactApplicationContext

class LegacyModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "LegacyModule"

  override fun onCatalystInstanceDestroy() {
    // legacy teardown hook removed in the New Architecture
  }
}
