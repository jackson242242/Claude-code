package com.voicememobot.wear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.Composable
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.navigation.SwipeDismissableNavHost
import androidx.wear.compose.navigation.composable
import androidx.wear.compose.navigation.rememberSwipeDismissableNavController
import com.voicememobot.wear.ui.CreateScreen
import com.voicememobot.wear.ui.FeedScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { VoiceMemoBotApp() }
    }
}

/**
 * Feed-first, matching the watchOS app and the web prototype: the feed is
 * the landing screen and Create opens from the red + chip at its top.
 * Swipe right to dismiss Create and land back on the feed.
 */
@Composable
fun VoiceMemoBotApp() {
    val navController = rememberSwipeDismissableNavController()
    MaterialTheme {
        SwipeDismissableNavHost(navController = navController, startDestination = "feed") {
            composable("feed") {
                FeedScreen(openCreate = { navController.navigate("create") })
            }
            composable("create") {
                CreateScreen(onPosted = { navController.popBackStack() })
            }
        }
    }
}
