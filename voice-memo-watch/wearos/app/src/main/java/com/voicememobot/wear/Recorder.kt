package com.voicememobot.wear

import android.content.Context
import android.media.MediaRecorder
import android.os.Build
import java.io.File

/**
 * MediaRecorder wrapper producing an AAC .m4a file — the same container the
 * watchOS Recorder emits, so the backend treats both watches identically.
 */
class Recorder(private val context: Context) {
    private var recorder: MediaRecorder? = null
    private var output: File? = null

    val isRecording: Boolean get() = recorder != null

    fun start() {
        val file = File(context.cacheDir, "memo-${System.currentTimeMillis()}.m4a")
        val mediaRecorder =
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) MediaRecorder(context)
            else @Suppress("DEPRECATION") MediaRecorder()
        mediaRecorder.apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            setAudioSamplingRate(44100)
            setAudioEncodingBitRate(96_000)
            setOutputFile(file.absolutePath)
            prepare()
            start()
        }
        recorder = mediaRecorder
        output = file
    }

    /** Stops recording and returns the finished file, or null on failure. */
    fun stop(): File? {
        val mediaRecorder = recorder ?: return null
        recorder = null
        return try {
            mediaRecorder.stop()
            mediaRecorder.release()
            output
        } catch (e: RuntimeException) {
            // stop() throws if nothing was captured
            mediaRecorder.release()
            output?.delete()
            null
        } finally {
            output = null
        }
    }
}
