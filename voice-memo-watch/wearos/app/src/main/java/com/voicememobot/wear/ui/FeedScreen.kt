package com.voicememobot.wear.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.material.Chip
import androidx.wear.compose.material.ChipDefaults
import androidx.wear.compose.material.Text
import com.voicememobot.wear.ApiClient
import com.voicememobot.wear.Post
import kotlinx.coroutines.launch

// 2026 trend palette — Pantone Cloud Dancer canvas, WGSN Transformative
// Teal primary, Coloro Fuchsia energy accent. No black surfaces.
val CloudDancer = Color(0xFFF0EEE8)
val AccentTeal = Color(0xFF0E7C7B)
val AccentFuchsia = Color(0xFFC7378E)
val InkText = Color(0xFF2B2A26)

/**
 * The landing screen: a single-column card feed (gradient cover, caption
 * overlay, byline + one-tap like) with a teal Create chip pinned at the top —
 * the Wear OS twin of the watchOS FeedView.
 */
@Composable
fun FeedScreen(openCreate: () -> Unit) {
    val api = remember { ApiClient() }
    val scope = rememberCoroutineScope()
    var posts by remember { mutableStateOf<List<Post>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            posts = api.fetchFeed()
            error = null
        } catch (e: Exception) {
            error = "Could not load the feed"
        }
    }

    ScalingLazyColumn(modifier = Modifier.fillMaxSize()) {
        item {
            Chip(
                onClick = openCreate,
                label = { Text("＋ Create", fontWeight = FontWeight.Bold) },
                colors = ChipDefaults.primaryChipColors(backgroundColor = AccentTeal),
                modifier = Modifier.fillMaxWidth()
            )
        }
        when {
            error != null -> item {
                Text(error!!, fontSize = 12.sp, color = AccentFuchsia)
            }
            posts.isEmpty() -> item {
                Text(
                    "No remixes yet — be the first",
                    fontSize = 12.sp,
                    color = Color.Gray,
                    modifier = Modifier.padding(top = 12.dp)
                )
            }
            else -> items(posts) { post ->
                PostCard(post = post) {
                    scope.launch {
                        runCatching { api.likePost(post.id) }.onSuccess { updated ->
                            posts = posts.map { if (it.id == updated.id) updated else it }
                        }
                    }
                }
            }
        }
    }
}

/**
 * One feed card: stable per-post gradient cover with the caption overlaid
 * on a bottom scrim, then a compact byline with a one-tap like.
 */
@Composable
private fun PostCard(post: Post, onLike: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(CloudDancer)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(60.dp)
                .background(Brush.linearGradient(coverColors(post.id)))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            0.4f to Color.Transparent,
                            1f to Color.Black.copy(alpha = 0.55f)
                        )
                    )
            )
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(6.dp)
            ) {
                Text(
                    post.style.uppercase(),
                    fontSize = 8.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color.Black.copy(alpha = 0.35f))
                        .padding(horizontal = 5.dp, vertical = 1.dp)
                )
                Text(
                    post.caption.ifEmpty { "${post.style} remix" },
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 7.dp, vertical = 5.dp)
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(14.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.linearGradient(
                            listOf(AccentTeal, AccentFuchsia)
                        )
                    )
            ) {
                Text(
                    post.author.take(1).uppercase(),
                    fontSize = 8.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
            Text(
                post.author,
                fontSize = 11.sp,
                color = InkText.copy(alpha = 0.65f),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier
                    .padding(start = 4.dp)
                    .weight(1f)
            )
            Chip(
                onClick = onLike,
                label = { Text("♥ ${post.likes}", fontSize = 11.sp, color = AccentFuchsia) },
                colors = ChipDefaults.childChipColors(),
                modifier = Modifier.height(24.dp)
            )
        }
    }
}

/** Deterministic palette from the post id, mirroring the web cover generator. */
private fun coverColors(seed: String): List<Color> {
    // 2026 trend hues: transformative teal, fuchsia, caramel, mint, violet
    val palettes = listOf(
        listOf(Color(0xFF18A39E), Color(0xFF3FC4D1)),  // teal → aqua
        listOf(Color(0xFFD14BA0), Color(0xFFE05673)),  // fuchsia → raspberry
        listOf(Color(0xFFE0913F), Color(0xFFEDC23F)),  // caramel → gold
        listOf(Color(0xFF55C795), Color(0xFF1F9A93)),  // mint → teal
        listOf(Color(0xFF9A6BD4), Color(0xFFD14BB4)),  // violet → fuchsia
    )
    var hash = 0
    for (c in seed) hash = (hash * 31 + c.code) and 0x7fffffff
    return palettes[hash % palettes.size]
}
