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

val AccentRed = Color(0xFFFF2442)

/**
 * The landing screen: a single-column card feed (gradient cover, caption
 * overlay, byline + one-tap like) with a red Create chip pinned at the top —
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
                colors = ChipDefaults.primaryChipColors(backgroundColor = AccentRed),
                modifier = Modifier.fillMaxWidth()
            )
        }
        when {
            error != null -> item {
                Text(error!!, fontSize = 12.sp, color = AccentRed)
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
            .background(Color(0xFF1C1C1E))
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
                            listOf(Color(0xFFFF8A5C), AccentRed)
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
                color = Color.Gray,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier
                    .padding(start = 4.dp)
                    .weight(1f)
            )
            Chip(
                onClick = onLike,
                label = { Text("♥ ${post.likes}", fontSize = 11.sp, color = AccentRed) },
                colors = ChipDefaults.childChipColors(),
                modifier = Modifier.height(24.dp)
            )
        }
    }
}

/** Deterministic palette from the post id, mirroring the web cover generator. */
private fun coverColors(seed: String): List<Color> {
    val palettes = listOf(
        listOf(Color(0xFFF24667), Color(0xFFF2914D)),  // red → orange
        listOf(Color(0xFF4D9BF2), Color(0xFF8A5CF2)),  // blue → violet
        listOf(Color(0xFF38D9A9), Color(0xFF3BB7D9)),  // emerald → teal
        listOf(Color(0xFFB05CF2), Color(0xFFF25C9B)),  // purple → pink
        listOf(Color(0xFFF2A30F), Color(0xFFF2D02E)),  // orange → gold
    )
    var hash = 0
    for (c in seed) hash = (hash * 31 + c.code) and 0x7fffffff
    return palettes[hash % palettes.size]
}
