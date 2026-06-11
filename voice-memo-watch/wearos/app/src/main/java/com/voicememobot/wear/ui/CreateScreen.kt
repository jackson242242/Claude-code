package com.voicememobot.wear.ui

import android.Manifest
import android.app.RemoteInput
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.material.Chip
import androidx.wear.compose.material.ChipDefaults
import androidx.wear.compose.material.CompactChip
import androidx.wear.compose.material.Text
import androidx.wear.input.RemoteInputIntentHelper
import com.voicememobot.wear.ApiClient
import com.voicememobot.wear.PromptSuggestion
import com.voicememobot.wear.Recorder
import com.voicememobot.wear.Render
import com.voicememobot.wear.Style
import com.voicememobot.wear.Tweaks
import kotlinx.coroutines.launch

/**
 * The create flow on one scrolling screen, mirroring the watchOS app:
 * record → pick a vibe (one tap renders) → one-tap remix tools
 * (slower / faster / echo / reverse, always re-applied to the original
 * memo) → describe the sound in natural language (tap a ready-made
 * suggestion, or dictate it by voice — this is a watch, talking beats
 * typing) → post to the feed.
 */
@Composable
fun CreateScreen(onPosted: () -> Unit) {
    val context = LocalContext.current
    val api = remember { ApiClient() }
    val recorder = remember { Recorder(context) }
    val scope = rememberCoroutineScope()

    var isRecording by remember { mutableStateOf(false) }
    var memoId by remember { mutableStateOf<String?>(null) }
    var styles by remember { mutableStateOf<List<Style>>(emptyList()) }
    var suggestions by remember { mutableStateOf<List<PromptSuggestion>>(emptyList()) }
    var selectedStyle by remember { mutableStateOf<String?>(null) }
    var tweaks by remember { mutableStateOf(Tweaks()) }
    var prompt by remember { mutableStateOf("") }
    var render by remember { mutableStateOf<Render?>(null) }
    var status by remember { mutableStateOf("Tap to record a voice memo") }
    var busy by remember { mutableStateOf(false) }

    val micPermission = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            recorder.start()
            isRecording = true
            status = "Recording… tap to stop"
        } else {
            status = "Microphone permission needed"
        }
    }

    fun rerender(styleId: String, newTweaks: Tweaks = tweaks) {
        val memo = memoId ?: return
        if (busy) return
        busy = true
        status = "Rendering…"
        scope.launch {
            runCatching {
                api.renderMemo(memo, styleId, newTweaks, emptyList(), prompt)
            }.onSuccess {
                render = it
                selectedStyle = styleId
                tweaks = newTweaks
                status = "Ready — tweak or post"
            }.onFailure {
                status = "Render failed, try again"
            }
            busy = false
        }
    }

    // Dictate the sound prompt: the watch's RemoteInput sheet offers voice
    // input first, so "a demon villain talking in a cave" is spoken, not typed.
    val dictation = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val spoken = result.data
            ?.let { RemoteInput.getResultsFromIntent(it) }
            ?.getCharSequence("prompt")?.toString()?.trim().orEmpty()
        if (spoken.isNotEmpty()) {
            prompt = spoken.take(200)
            selectedStyle?.let { rerender(it) }
        }
    }

    fun launchDictation() {
        val intent = RemoteInputIntentHelper.createActionRemoteInputIntent()
        val remoteInput = RemoteInput.Builder("prompt")
            .setLabel("Describe the sound…")
            .build()
        RemoteInputIntentHelper.putRemoteInputsExtra(intent, listOf(remoteInput))
        dictation.launch(intent)
    }

    ScalingLazyColumn(modifier = Modifier.fillMaxSize()) {
        item {
            Chip(
                onClick = {
                    if (isRecording) {
                        isRecording = false
                        val file = recorder.stop()
                        if (file == null) {
                            status = "Nothing was recorded"
                        } else {
                            busy = true
                            status = "Uploading…"
                            scope.launch {
                                runCatching {
                                    val memo = api.uploadMemo(file)
                                    styles = api.fetchStyles()
                                    suggestions = api.fetchPromptSuggestions()
                                    memo
                                }.onSuccess {
                                    memoId = it.id
                                    render = null
                                    selectedStyle = null
                                    tweaks = Tweaks()
                                    prompt = ""
                                    status = "Pick a vibe ↓"
                                }.onFailure {
                                    status = "Upload failed — is the API reachable?"
                                }
                                busy = false
                            }
                        }
                    } else {
                        micPermission.launch(Manifest.permission.RECORD_AUDIO)
                    }
                },
                label = {
                    Text(
                        if (isRecording) "■ Stop" else "● Record",
                        fontWeight = FontWeight.Bold
                    )
                },
                colors = ChipDefaults.primaryChipColors(backgroundColor = AccentTeal),
                enabled = !busy,
                modifier = Modifier.fillMaxWidth()
            )
        }
        item {
            Text(status, fontSize = 11.sp, color = Color.Gray,
                 modifier = Modifier.padding(vertical = 2.dp))
        }
        if (memoId != null) {
            items(styles) { style ->
                Chip(
                    onClick = { rerender(style.id) },
                    label = { Text(style.label) },
                    colors = if (style.id == selectedStyle)
                        ChipDefaults.gradientBackgroundChipColors()
                    else ChipDefaults.secondaryChipColors(),
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
        if (render != null) {
            item {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    CompactChip(
                        onClick = {
                            rerender(
                                selectedStyle!!,
                                tweaks.copy(speed = (tweaks.speed - 0.25).coerceAtLeast(0.5))
                            )
                        },
                        label = { Text("🐢", fontSize = 12.sp) },
                        enabled = !busy
                    )
                    CompactChip(
                        onClick = {
                            rerender(
                                selectedStyle!!,
                                tweaks.copy(speed = (tweaks.speed + 0.25).coerceAtMost(2.0))
                            )
                        },
                        label = { Text("🐇", fontSize = 12.sp) },
                        enabled = !busy
                    )
                    CompactChip(
                        onClick = {
                            rerender(
                                selectedStyle!!,
                                tweaks.copy(echo = (tweaks.echo + 0.25).coerceAtMost(1.0))
                            )
                        },
                        label = { Text("🌊", fontSize = 12.sp) },
                        enabled = !busy
                    )
                    CompactChip(
                        onClick = {
                            rerender(selectedStyle!!, tweaks.copy(reverse = !tweaks.reverse))
                        },
                        label = { Text("⏪", fontSize = 12.sp) },
                        enabled = !busy
                    )
                }
            }
            item {
                Chip(
                    onClick = { launchDictation() },
                    label = { Text("🎤 Describe the sound", fontSize = 12.sp) },
                    colors = ChipDefaults.secondaryChipColors(),
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth()
                )
            }
            items(suggestions) { suggestion ->
                Chip(
                    onClick = {
                        prompt = suggestion.text
                        rerender(selectedStyle!!)
                    },
                    label = { Text(suggestion.label, fontSize = 12.sp) },
                    colors = if (prompt == suggestion.text)
                        ChipDefaults.gradientBackgroundChipColors()
                    else ChipDefaults.childChipColors(),
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth()
                )
            }
            item {
                Chip(
                    onClick = {
                        busy = true
                        scope.launch {
                            runCatching {
                                api.createPost(render!!.id, "wear-user", "")
                            }.onSuccess {
                                onPosted()
                            }.onFailure {
                                status = "Post failed, try again"
                            }
                            busy = false
                        }
                    },
                    label = { Text("Post to Feed", fontWeight = FontWeight.Bold) },
                    colors = ChipDefaults.primaryChipColors(backgroundColor = AccentTeal),
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}
