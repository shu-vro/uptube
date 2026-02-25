package expo.modules.ytdl

import android.net.Uri
import android.util.Log
import com.yausername.ffmpeg.FFmpeg
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLRequest
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class UptubeYTDLModule : Module() {
  @Volatile
  private var isInitialized = false

  override fun definition() = ModuleDefinition {
    Name("UptubeYTDL")

    Events("onProgress")

    AsyncFunction("getInfo") { url: String ->
      try {
        ensureInitialized()
        val request = YoutubeDLRequest(url).apply {
          addOption("--dump-json")
          addOption("--no-check-certificate")
          addOption("--skip-download")
          addOption("--no-update")  // Suppress version warning
        }
        
        val response = YoutubeDL.getInstance().execute(request)
        response.out ?: ""
      } catch (e: Exception) {
        Log.e("UptubeYTDL", "Failed to get info for $url", e)
        throw Exception("Failed to get video info: ${e.message ?: "Unknown error"}")
      }
    }

    AsyncFunction("download") { url: String, format: String, outputPath: String ->
      ensureInitialized()
      
      try {
        // Convert file:// URI to filesystem path if needed
        val actualPath = if (outputPath.startsWith("file://")) {
          Uri.parse(outputPath).path ?: outputPath.removePrefix("file://")
        } else {
          outputPath
        }
        
        Log.d("UptubeYTDL", "Download requested - Original path: $outputPath, Actual path: $actualPath")
        
        val outputFile = File(actualPath)
        
        // Ensure parent directory exists
        outputFile.parentFile?.let { parentDir ->
          if (!parentDir.exists()) {
            val created = parentDir.mkdirs()
            Log.d("UptubeYTDL", "Created parent directory: $parentDir (success: $created)")
          }
        }
        
        val request = YoutubeDLRequest(url).apply {
          addOption("-o", actualPath)
          if (format.isNotEmpty()) {
            addOption("-f", format)
          }
          addOption("--no-mtime")
          addOption("--no-check-certificate")
          addOption("--no-update")  // Suppress version warning
        }
        
        // Execute with progress callback
        YoutubeDL.getInstance().execute(request) { progress, eta, line ->
          sendEvent("onProgress", mapOf(
            "url" to url,
            "progress" to progress,
            "eta" to eta,
            "line" to line
          ))
        }
        
        Log.d("UptubeYTDL", "Download completed for $url to $actualPath")
      } catch (e: Exception) {
        Log.e("UptubeYTDL", "Download failed for $url", e)
        sendEvent("onProgress", mapOf(
          "url" to url,
          "error" to (e.message ?: "Unknown download error")
        ))
        throw Exception("Download failed: ${e.message ?: "Unknown error"}")
      }
    }
  }

  @Synchronized
  private fun ensureInitialized() {
    if (isInitialized) return
    
    try {
      val context = appContext.reactContext?.applicationContext 
        ?: throw IllegalStateException("React Context is null. Cannot initialize native libraries.")
      
      Log.d("UptubeYTDL", "Starting initialization with context: ${context.packageName}")
      
      try {
        YoutubeDL.getInstance().init(context)
        Log.d("UptubeYTDL", "YoutubeDL initialized successfully")
      } catch (e: Exception) {
        Log.e("UptubeYTDL", "YoutubeDL init failed", e)
        throw Exception("YoutubeDL initialization failed: ${e.message ?: e.javaClass.simpleName}")
      }
      
      try {
        FFmpeg.getInstance().init(context)
        Log.d("UptubeYTDL", "FFmpeg initialized successfully")
      } catch (e: Exception) {
        Log.e("UptubeYTDL", "FFmpeg init failed", e)
        throw Exception("FFmpeg initialization failed: ${e.message ?: e.javaClass.simpleName}")
      }
      
      isInitialized = true
      Log.d("UptubeYTDL", "All native libraries initialized successfully")
    } catch (e: Exception) {
      Log.e("UptubeYTDL", "Failed to initialize native binaries", e)
      isInitialized = false
      throw Exception("Native library initialization failed: ${e.message ?: e.javaClass.simpleName}")
    }
  }
}