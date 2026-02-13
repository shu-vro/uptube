package expo.modules.ytdl

import android.util.Log
import com.yausername.ffmpeg.FFmpeg
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLRequest
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

class UptubeYTDLModule : Module() {
  private val scope = CoroutineScope(Dispatchers.IO)
  
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
        }
        
        val response = YoutubeDL.getInstance().execute(request)
        response.out ?: ""
      } catch (e: Exception) {
        Log.e("UptubeYTDL", "Failed to get info for $url", e)
        throw Exception("Failed to get video info: ${e.message ?: "Unknown error"}")
      }
    }

    // Use AsyncFunction with suspend for proper coroutine support
    AsyncFunction("download") { url: String, format: String, outputPath: String ->
      ensureInitialized()
      
      withContext(Dispatchers.IO) {
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
            this@UptubeYTDLModule.sendEvent("onProgress", mapOf(
              "url" to url,
              "progress" to progress,
              "eta" to eta,
              "line" to line
            ))
          }
          
          Log.d("UptubeYTDL", "Download completed for $url")
        } catch (e: Exception) {
          Log.e("UptubeYTDL", "Download failed for $url", e)
          this@UptubeYTDLModule.sendEvent("onProgress", mapOf(
            "url" to url,
            "error" to (e.message ?: "Unknown download error")
          ))
          throw Exception("Download failed: ${e.message ?: "Unknown error"}")
        }
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