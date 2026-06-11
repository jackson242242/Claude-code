package com.voicememobot.wear

import kotlinx.serialization.Serializable

// These types map 1:1 onto the backend's camelCase JSON contract — the same
// shapes as the watchOS app's Models.swift.

@Serializable
data class Style(val id: String, val label: String, val description: String)

@Serializable
data class Instrument(val id: String, val label: String, val description: String)

@Serializable
data class PromptSuggestion(val label: String, val text: String)

@Serializable
data class Memo(
    val id: String,
    val filename: String,
    val contentType: String,
    val sizeBytes: Long,
    val createdAt: String,
)

/** One-click adjustments, always applied to the original memo. */
@Serializable
data class Tweaks(
    val speed: Double = 1.0,
    val echo: Double = 0.0,
    val volume: Double = 1.0,
    val reverse: Boolean = false,
)

@Serializable
data class RenderRequest(
    val style: String,
    val tweaks: Tweaks = Tweaks(),
    val instruments: List<String> = emptyList(),
    val prompt: String = "",
)

@Serializable
data class Render(
    val id: String,
    val memoId: String,
    val style: String,
    val tweaks: Tweaks,
    val instruments: List<String>,
    val prompt: String,
    val status: String,
    val fileUrl: String,
    val createdAt: String,
)

@Serializable
data class PostRequest(
    val renderId: String,
    val author: String = "anonymous",
    val caption: String = "",
)

@Serializable
data class Post(
    val id: String,
    val renderId: String,
    val style: String,
    val author: String,
    val caption: String,
    val likes: Int,
    val fileUrl: String,
    val permalink: String,
    val forwardedFrom: String? = null,
    val createdAt: String,
)
