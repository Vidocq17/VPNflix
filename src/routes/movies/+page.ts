import { browseLoad } from '$lib/browse';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url, fetch }) => browseLoad('movie', url, fetch);
