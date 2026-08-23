export interface ProviderSearchResult { providerVideoId:string; title:string; artist?:string; album?:string; thumbnailUrl?:string; durationSeconds?:number; providerUrl?:string; }
export interface ProviderMetadata extends ProviderSearchResult { description?:string; viewCount?:number; }
export interface MetadataProvider { search(query:string,page?:number):Promise<ProviderSearchResult[]>; getVideoMetadata(providerVideoId:string):Promise<ProviderMetadata>; }

export class YouTubeMetadataProvider implements MetadataProvider {
  constructor(private readonly apiKey:string) {}
  private async request<T>(params:URLSearchParams):Promise<T>{const url=new URL('https://www.googleapis.com/youtube/v3/search');params.set('key',this.apiKey);const r=await fetch(`${url}?${params}`);if(!r.ok)throw new Error(`youtube_api_${r.status}`);return r.json() as Promise<T>}
  async search(query:string,page=1){const data=await this.request<any>(new URLSearchParams({part:'snippet',type:'video',q:query,maxResults:'25',pageToken:page>1?'':''}));return (data.items||[]).map((x:any)=>({providerVideoId:x.id.videoId,title:x.snippet.title,thumbnailUrl:x.snippet.thumbnails?.medium?.url,providerUrl:`https://www.youtube.com/watch?v=${x.id.videoId}`}));}
  async getVideoMetadata(providerVideoId:string){const params=new URLSearchParams({part:'snippet,contentDetails,statistics',id:providerVideoId});const data=await this.request<any>(params);const x=data.items?.[0];if(!x)throw new Error('provider_not_found');return {providerVideoId,title:x.snippet.title,thumbnailUrl:x.snippet.thumbnails?.medium?.url,providerUrl:`https://www.youtube.com/watch?v=${providerVideoId}`,viewCount:Number(x.statistics?.viewCount||0)};}
}
