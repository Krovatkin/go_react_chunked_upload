class FileToUpload {
    static chunkSize = 1000000;
    static uploadUrl = 'http://localhost:8080/api/v1/photo';
    readonly request: XMLHttpRequest;
    readonly file: File;
    currentChunkStartByte: number;
    currentChunkFinalByte: number;

    constructor(file: File, name: string) {
        this.request = new XMLHttpRequest();
        this.request.overrideMimeType('application/octet-stream');

        this.file = file;
        this.currentChunkStartByte = 0;
        this.currentChunkFinalByte = FileToUpload.chunkSize > this.file.size ? this.file.size : FileToUpload.chunkSize;
    }

    uploadFile() {
        this.request.open('POST', FileToUpload.uploadUrl, true);

        let chunk: Blob = this.file.slice(this.currentChunkStartByte, this.currentChunkFinalByte);
        this.request.setRequestHeader('Content-Range', `bytes ${this.currentChunkStartByte}-${this.currentChunkFinalByte}/${this.file.size}`);
        
        this.request.onload = () => {
            const remainingBytes = this.file.size - this.currentChunkFinalByte;
            
            if(this.currentChunkFinalByte === this.file.size) {
                alert('Yay, download completed! Chao!');
                return;
            } else if (remainingBytes < FileToUpload.chunkSize) {
                this.currentChunkStartByte = this.currentChunkFinalByte;
                this.currentChunkFinalByte = this.currentChunkStartByte + remainingBytes;
            }
            else {
                this.currentChunkStartByte = this.currentChunkFinalByte;
                this.currentChunkFinalByte = this.currentChunkStartByte + FileToUpload.chunkSize;
            }

            this.uploadFile();
        }

        const formData = new FormData();
        formData.append('file', chunk, this.file.name); 
        this.request.send(formData);
    }
}

const UploadMediaComponent: React.FC = () => {
const [filesToUpload, setFilesToUpload] = React.useState([] as FileToUpload[]);

const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: FileList | null = e.target.files;
    if(!files) return;

    let filesToUpload: FileToUpload[] = [];
    for (let i = 0; i < files.length; i++) {
        filesToUpload.push(new FileToUpload(files[i], files[i].name));
    }

    setFilesToUpload(filesToUpload);
};

const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    for (let i = 0; i < filesToUpload.length; i++) {
        filesToUpload[i].uploadFile();
    }
};

return (
    <div className="upload-container">
        <h2 className="upload-title">File Uploader</h2>
        <div className="upload-form">
            <form id="file_upload" onSubmit={onFormSubmit}>
                <div className="upload-file-select">
                    <label htmlFor="file_1">Select files for upload</label>
                    <input id="file_1" type="file" multiple onChange={onFileChange}/>
                </div>

                <div className="upload-file-list">
                    {filesToUpload.map((f,i) => <div className="upload-file" key={i}>{f.file.name} - {f.file.size}bytes</div>)}
                </div>

                <div className="upload-submit">
                    <input type="submit" value="submit"/>
                </div>
            </form>
        </div>
    </div>    
)
}

function MyApp() {
return <div>
    <h1>Uploader</h1>
    <UploadMediaComponent/>
    </div>;
}

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<MyApp />);