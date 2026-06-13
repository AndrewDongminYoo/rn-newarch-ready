package com.example

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

class LegacyModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "LegacyModule"

    override fun onCatalystInstanceDestroy() {
        // legacy teardown hook removed in the New Architecture
    }
}
