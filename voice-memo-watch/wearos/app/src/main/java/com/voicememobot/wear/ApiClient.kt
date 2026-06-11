package com.voicememobot.wear

import java.io.File
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody

class ApiException(message: String) : Exception(message)

/**
 * OkHttp client for the VoiceMemoBot backend — the Kotlin twin of the
 * watchOS APIClient.swift, speaking the same camelCase JSON contract.
 */
class ApiClient(private val baseUrl: String = AppConfig.API_BASE_URL) {
    private val http = OkHttpClient()
    private val json = Json { ignoreUnknownKeys = true }
    private val jsonMedia = "application/json".toMediaType()

    suspend fun fetchStyles(): List<Style> = get("/styles")

    suspend fun fetchInstruments(): List<Instrument> = get("/instruments")

    suspend fun fetchFeed(): List<Post> = get("/posts")

    suspend fun fetchPromptSuggestions(): List<PromptSuggestion> =
        get("/prompts/suggestions")

    suspend fun uploadMemo(file: File): Memo = withContext(Dispatchers.IO) {
        val body = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart(
                "file", "memo.m4a",
                file.asRequestBody("audio/mp4".toMediaType())
            )
            .build()
        execute(Request.Builder().url("$baseUrl/memos").post(body).build())
    }

    suspend fun renderMemo(
        memoId: String,
        style: String,
        tweaks: Tweaks = Tweaks(),
        instruments: List<String> = emptyList(),
        prompt: String = "",
    ): Render = postJson(
        "/memos/$memoId/renders",
        json.encodeToString(
            RenderRequest.serializer(),
            RenderRequest(style, tweaks, instruments, prompt)
        )
    )

    suspend fun createPost(renderId: String, author: String, caption: String): Post =
        postJson(
            "/posts",
            json.encodeToString(
                PostRequest.serializer(),
                PostRequest(renderId, author, caption)
            )
        )

    suspend fun likePost(postId: String): Post = withContext(Dispatchers.IO) {
        execute(
            Request.Builder()
                .url("$baseUrl/posts/$postId/like")
                .post(ByteArray(0).toRequestBody(null))
                .build()
        )
    }

    private suspend inline fun <reified T> get(path: String): T =
        withContext(Dispatchers.IO) {
            execute(Request.Builder().url("$baseUrl$path").get().build())
        }

    private suspend inline fun <reified T> postJson(path: String, payload: String): T =
        withContext(Dispatchers.IO) {
            val body: RequestBody = payload.toRequestBody(jsonMedia)
            execute(Request.Builder().url("$baseUrl$path").post(body).build())
        }

    private inline fun <reified T> execute(request: Request): T {
        http.newCall(request).execute().use { response ->
            val text = response.body?.string().orEmpty()
            if (!response.isSuccessful) {
                throw ApiException("HTTP ${response.code}: $text")
            }
            return json.decodeFromString(text)
        }
    }
}
