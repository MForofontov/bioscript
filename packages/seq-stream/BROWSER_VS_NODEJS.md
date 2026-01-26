# Browser vs Node.js Memory Usage

## Quick Answer

- **Node.js**: ✅ Constant **~50MB RAM** for any file size (1MB to 300GB+)
- **Browser**: ⚠️ **File must fit in memory** (~1-2GB practical limit)

## Why?

### Node.js: True Streaming

Reads file in chunks from disk → processes → discards. Memory stays constant.

### Browser: Pseudo-Streaming

File is loaded into memory first (security restriction). The `File` API can't read directly from disk, so the entire file must fit in RAM before "streaming" begins.

## Memory Comparison

| File Size | Node.js | Browser  | Recommendation         |
| --------- | ------- | -------- | ---------------------- |
| < 500 MB  | ~50 MB  | ~500 MB  | ✅ Both OK             |
| 1-2 GB    | ~50 MB  | ~1-2 GB  | ⚠️ Node.js recommended |
| > 2 GB    | ~50 MB  | ❌ Crash | ⚠️ Node.js only        |

## Usage

**For large files (> 2GB):**

```bash
npm install bioseq-stream
node examples/process-big-files.js fastq huge-file.fastq.gz
```

**For small files (< 500MB):**

```html
<script type="module">
  import { parseFastaBrowser } from 'bioseq-stream/browser';
  // Works great!
</script>
```
