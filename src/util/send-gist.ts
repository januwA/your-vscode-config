import axios from 'axios';
import { IUserConfig, IUserVscodeConfig } from '../extension';

export async function sendGist(userConfig: IUserConfig, userVscodeConfig: IUserVscodeConfig) {
	const http = axios.create({
		baseURL: 'https://api.github.com',
		headers: {
			Authorization: `token ${userConfig.githubToken}`,
			Accept: `application/vnd.github.v3+json`,
			'Content-Type': `application/json`
		}
	});

	return http({
		url: '/gists/' + userConfig.gistId,
		method: 'PATCH',
		data: {
			files: {
				'c.json': {
					content: JSON.stringify(userVscodeConfig)
				}
			}
		}
	});
}
