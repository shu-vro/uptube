package expo.modules.ytdl

import android.util.Log
import com.yausername.ffmpeg.FFmpeg
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLRequest
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File

class UptubeYTDLModule : Module() {
  private val scope = CoroutineScope(Dispatchers.IO)
  
  @Volatile
  private var isInitialized = false

  override fun definition() = ModuleDefinition {
    Name("UptubeYTDL")

    Events("onProgress")

    // AsyncFunction to get video info
    AsyncFunction("getInfo") { url: String ->
      try {
        ensureInitialized() // Initialize only when first called
        val request = YoutubeDLRequest(url).apply {
          addOption("--dump-json")
          addOption("--no-check-certificate")
        }
        
        val response = YoutubeDL.getInstance().execute(request)
        return@AsyncFunction response.out ?: ""
      } catch (e: Exception) {
        Log.e("UptubeYTDL", "Failed to get info for $url", e)
        throw e
      }
    }

    // AsyncFunction for downloading
    AsyncFunction("download") { url: String, format: String, outputPath: String ->
      ensureInitialized()
      scope.launch {
        try {
          val outputFile = File(outputPath)
          outputFile.parentFile?.mkdirs()
          
          val request = YoutubeDLRequest(url).apply {
            addOption("-o", outputPath)
            if (format.isNotEmpty()) {
              addOption("-f", format)
            }
            addOption("--no-mtime")
            addOption("--no-check-certificate")
          }
          
          YoutubeDL.getInstance().execute(request) { progress, eta, line ->
            sendEvent("onProgress", mapOf(
              "url" to url,
              "progress" to progress,
              "eta" to eta,
              "line" to line
            ))
          }
        } catch (e: Exception) {
          Log.e("UptubeYTDL", "Download failed for $url", e)
          sendEvent("onProgress", mapOf(
            "url" to url,
            "error" to e.message ?: "Unknown download error"
          ))
        }
      }
    }
  }

  /**
   * Safe initialization that avoids crashing the module during app startup.
   */
  @Synchronized
  private fun ensureInitialized() {
    if (isInitialized) return
    
    try {
      // Accessing the application context safely through the Expo appContext
      val context = appContext.reactContext?.applicationContext 
        ?: throw IllegalStateException("React Context is null. Cannot initialize native libraries.")
      
      Log.d("UptubeYTDL", "Starting initialization...")
      
      // Initialize binaries
      YoutubeDL.getInstance().init(context)
      FFmpeg.getInstance().init(context)
      
      isInitialized = true
      Log.d("UptubeYTDL", "YoutubeDL and FFmpeg initialized successfully")
    } catch (e: Exception) {
      Log.e("UptubeYTDL", "Failed to initialize native binaries", e)
      // We throw the error so the JS side receives a clear rejection message
      throw Exception("Native library initialization failed: ${e.message}")
    }
  }
}