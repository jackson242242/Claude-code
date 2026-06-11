package com.voicememobot.wear

/**
 * Where the VoiceMemoBot backend lives. For the emulator use 10.0.2.2 to
 * reach the host machine; on a real watch set your machine's LAN IP or the
 * deployed Render URL (HTTPS).
 */
object AppConfig {
    const val API_BASE_URL = "http://10.0.2.2:8000"
}
