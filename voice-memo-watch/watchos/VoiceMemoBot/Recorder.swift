import AVFoundation
import Foundation

/// Thin AVAudioRecorder wrapper: records a mono AAC (.m4a) memo into the
/// temporary directory and publishes recording state for the UI.
@MainActor
final class Recorder: NSObject, ObservableObject {
    @Published var isRecording = false
    @Published var lastRecordingURL: URL?
    @Published var errorMessage: String?

    private var recorder: AVAudioRecorder?

    func start() {
        let session = AVAudioSession.sharedInstance()
        session.requestRecordPermission { [weak self] granted in
            Task { @MainActor in
                guard let self else { return }
                guard granted else {
                    self.errorMessage = "Microphone access denied"
                    return
                }
                self.beginRecording(session: session)
            }
        }
    }

    private func beginRecording(session: AVAudioSession) {
        do {
            try session.setCategory(.record, mode: .default)
            try session.setActive(true)
            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("memo-\(UUID().uuidString).m4a")
            let settings: [String: Any] = [
                AVFormatIDKey: kAudioFormatMPEG4AAC,
                AVSampleRateKey: 44_100,
                AVNumberOfChannelsKey: 1,
                AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
            ]
            let recorder = try AVAudioRecorder(url: url, settings: settings)
            recorder.record()
            self.recorder = recorder
            isRecording = true
            errorMessage = nil
        } catch {
            errorMessage = "Could not start recording"
        }
    }

    func stop() {
        recorder?.stop()
        lastRecordingURL = recorder?.url
        recorder = nil
        isRecording = false
        try? AVAudioSession.sharedInstance().setActive(false)
    }
}
