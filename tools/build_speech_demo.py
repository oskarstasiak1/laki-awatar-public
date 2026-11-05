"""Generate the fixed Polish speech demo and sample-aligned phoneme cues.
Requires piper-tts[alignment]. The voice model stays outside the repository.
Usage: PYTHONPATH=/path/to/piper python tools/build_speech_demo.py /path/to/voice.onnx
"""
import json, sys, wave
from pathlib import Path
from dataclasses import asdict
from piper import PiperVoice, SynthesisConfig

model=Path(sys.argv[1])
root=Path(__file__).resolve().parents[1]/'dist'/'media'
root.mkdir(exist_ok=True)
text='Cześć, jestem Laki. Jak mogę Ci pomóc?'
voice=PiperVoice.load(model,include_alignments=True)
config=SynthesisConfig(length_scale=1.08,noise_scale=.5,noise_w_scale=.6)
chunks=list(voice.synthesize(text,syn_config=config,include_alignments=True))
assert chunks and all(c.phoneme_alignments is not None for c in chunks), 'Phoneme alignments unavailable'
frames=[];offset=0;cues=[]
for chunk in chunks:
 print('chunk',chunk.sample_rate,chunk.phonemes)
 print('alignments',[asdict(x) for x in chunk.phoneme_alignments][:8])
 cursor=offset
 for a in chunk.phoneme_alignments:
  count=int(a.num_samples)
  cues.append({'phoneme':a.phoneme,'start':cursor/chunk.sample_rate,'end':(cursor+count)/chunk.sample_rate})
  cursor+=count
 assert cursor-offset==len(chunk.audio_int16_array), 'Alignment/audio sample mismatch'
 frames.append(chunk.audio_int16_bytes)
 offset+=len(chunk.audio_int16_array)
with wave.open(str(root/'laki-welcome.wav'),'wb') as f:
 f.setnchannels(chunks[0].sample_channels);f.setsampwidth(chunks[0].sample_width);f.setframerate(chunks[0].sample_rate);f.writeframes(b''.join(frames))
(root/'laki-welcome.json').write_text(json.dumps({'text':text,'sampleRate':chunks[0].sample_rate,'duration':offset/chunks[0].sample_rate,'voice':'Piper pl_PL-darkman-medium','alignment':'model phoneme durations in audio samples','cues':cues},ensure_ascii=False,indent=2))
print('duration',offset/chunks[0].sample_rate)
