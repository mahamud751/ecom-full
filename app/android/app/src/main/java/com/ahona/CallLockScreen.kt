package com.ahona

import android.app.Activity
import android.os.Build
import android.view.WindowManager
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager
import java.lang.ref.WeakReference

/**
 * Lets the app show over the lock screen (and wake the screen) only while a
 * doctor's call is ringing or in progress. Permanently enabling it in the
 * manifest would let anyone see the app on a locked phone that was left on
 * Ahona.
 *
 * JS turns it on before posting the ringing notification, so even a
 * cold start from the full-screen call alert opens over the lock screen;
 * MainActivity applies the current value whenever it is created/resumed.
 */
object CallLockScreen {
  @Volatile var enabled = false
    private set

  private var activity: WeakReference<Activity>? = null

  fun attach(activity: Activity) {
    this.activity = WeakReference(activity)
    apply(activity)
  }

  fun setEnabled(value: Boolean) {
    enabled = value
    val a = activity?.get() ?: return
    a.runOnUiThread { apply(a) }
  }

  private fun apply(a: Activity) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      a.setShowWhenLocked(enabled)
      a.setTurnScreenOn(enabled)
    } else {
      @Suppress("DEPRECATION")
      val flags =
          WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
              WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
      if (enabled) a.window.addFlags(flags) else a.window.clearFlags(flags)
    }
  }
}

class CallLockScreenModule(context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {
  override fun getName() = "CallLockScreen"

  @ReactMethod
  fun setEnabled(value: Boolean) = CallLockScreen.setEnabled(value)
}

class CallLockScreenPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
      listOf(CallLockScreenModule(context))

  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> =
      emptyList()
}
