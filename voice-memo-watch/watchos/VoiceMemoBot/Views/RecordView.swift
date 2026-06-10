import SwiftUI

struct RecordView: View {
    @StateObject private var recorder = Recorder()

    var body: some View {
        VStack(spacing: 12) {
            Button {
                recorder.isRecording ? recorder.stop() : recorder.start()
            } label: {
                Image(systemName: recorder.isRecording ? "stop.circle.fill" : "mic.circle.fill")
                    .resizable()
                    .frame(width: 72, height: 72)
                    .foregroundStyle(recorder.isRecording ? .red : .accentColor)
            }
            .buttonStyle(.plain)

            Text(recorder.isRecording ? "Recording…" : "Tap to record a memo")
                .font(.footnote)
                .foregroundStyle(.secondary)

            if let message = recorder.errorMessage {
                Text(message).font(.footnote).foregroundStyle(.red)
            }

            if let url = recorder.lastRecordingURL, !recorder.isRecording {
                NavigationLink("Remix with AI") {
                    StylePickerView(memoFileURL: url)
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .navigationTitle("VoiceMemoBot")
    }
}
